"""
Schema:
    studies(
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        link TEXT,
        date TEXT,             
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        journal TEXT,
        doi TEXT,
        hash TEXT NOT NULL UNIQUE,
        author TEXT
    )
"""

import csv
import os
import re
import sqlite3
import sys
import time
import hashlib

import requests
from bs4 import BeautifulSoup

BOM = "\ufeff"
DATE_META_NAMES = [
    "citation_publication_date",
    "citation_date",
    "dc.date",
    "dc.date.issued",
    "dcterms.date",
    "prism.publicationdate",
    "prism.publicationdateyear",
    "publication_date",
    "date",
    "article:published_time",
    "pubdate",
]
YEAR_RE = re.compile(r"\\b(19|20)\\d{2}\\b")
DOI_PATTERNS = [
    "citation_doi",
    "dc.identifier",
    "dc.identifier.doi",
    "prism.doi",
    "doi",
]
JOURNAL_META_NAMES = [
    "citation_journal_title",
    "prism.publicationname",
    "journal",
    "dc.source",
    "citation_conference_title",
]

def parse_year_from_string(s: str) -> int:

    m = YEAR_RE.search(s)
    if not m:
        return None
    y = int(m.group(0))
    return y

def normalize_header(name: str) -> str:
    return (name or "").strip().lstrip(BOM).lower()

def hash_title(title: str):
    hasher = hashlib.sha256()
    title_bytes = title.encode('utf-8')
    hasher.update(title_bytes)
    hash_val = hasher.hexdigest()
    return hash_val


def ensure_schema(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS studies (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            link TEXT,
            date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            journal TEXT,
            doi TEXT,
            hash TEXT NOT NULL UNIQUE,
            authors TEXT NOT NULL
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_studies_year ON studies(date);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_studies_title ON studies(title);")
    conn.commit()

def fetch_html(url: str, timeout: float, user_agent: str) -> tuple[int, str]:

    headers = {"User-Agent": user_agent}
    resp = requests.get(url, headers=headers, timeout=timeout)
    return resp.status_code, resp.text

def soup_or_none(html: str):
    if BeautifulSoup is None:
        return None
    try:
        return BeautifulSoup(html, "html.parser")
    except Exception:
        return None

def meta_get_all(soup, names_lower: list[str]) -> list[str]:
    vals = []
    for tag in soup.find_all("meta"):
        name = (tag.get("name") or tag.get("property") or "").strip().lower()
        if name in names_lower:
            content = tag.get("content") or ""
            if content:
                vals.append(content.strip())
    return vals

def first_nonempty(*vals):
    for v in vals:
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def extract_metadata_pmc(html: str) -> dict:
    soup = soup_or_none(html)

    raw_date = first_nonempty(*meta_get_all(soup, ["citation_publication_date", "citation_date", "dc.date"]))
    year = parse_year_from_string(raw_date or "")
    journal = first_nonempty(*meta_get_all(soup, ["citation_journal_title"]))
    doi = first_nonempty(*meta_get_all(soup, ["citation_doi"]))

    # Authors from meta tags
    authors = meta_get_all(soup, ["citation_author"])

    # Fallback: look for a year in prominent header/front matter.
    if year is None:
        front = soup.find(id="front") or soup.find("header")
        if front:
            txt = front.get_text(" ", strip=True)
            year = parse_year_from_string(txt)

    return {
        "date": raw_date,
        "year": year,
        "journal": journal,
        "doi": doi,
        "authors": authors
    }


def get_or_fetch_metadata(url: str, timeout: float, user_agent: str, sleep_secs: float) -> dict:        

    try:
        status, html = fetch_html(url, timeout=timeout, user_agent=user_agent)
        meta = extract_metadata_pmc(html)
        if status != 200:
            print(f"Code: {status} for URL: {url}")
        if sleep_secs > 0:
            time.sleep(sleep_secs)
        return meta
    except Exception as e:
        print("definitiely not my prblem")
        return {"raw_date": None, "year": None, "journal": None, "doi": None}

def upsert_row(conn: sqlite3.Connection, row: dict) -> bool:
    cur = conn.cursor()
    cur.execute(
        """
        INSERT OR IGNORE INTO studies (title, link, date, journal, doi, hash)
        VALUES (:title, :link, :date, :journal, :doi, :hash)
        """,
        row,
    )
    conn.commit()
    return cur.rowcount > 0

def ingest(csv_path: str, db_path: str, timeout: float, user_agent: str, sleep_secs: float) -> dict:
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    conn = sqlite3.connect(db_path)
    try:
        ensure_schema(conn)
        inserted = 0
        skipped = 0
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            field_map = {normalize_header(h): h for h in reader.fieldnames or []}

            title_key = field_map.get("title")
            link_key = field_map.get("link")

            for raw in reader:
                title = (raw.get(title_key) or "").strip()
                hash_val = hash_title(title)
                link = (raw.get(link_key) or "").strip()
                if not title and not link:
                    skipped += 1
                    print("Failed to ingest " + str(title))
                    continue
                if not title:
                    title = link

                meta = {"date": None, "year": None, "journal": None, "doi": None}
                if link:
                    meta = get_or_fetch_metadata(link, timeout=timeout, user_agent=user_agent, sleep_secs=sleep_secs)

                success = upsert_row(
                    conn,
                    {
                        "title": title,
                        "link": link or None,
                        "date": meta.get("date"),
                        "journal": meta.get("journal"),
                        "doi": meta.get("doi"),
                        "hash": hash_val,
                        "authors": meta.get("authors")
                    },
                )
                if success:
                    inserted += 1
                else:
                    skipped += 1

        # this seems to be wrong? I don't really know or care why
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM studies;")
        total = cur.fetchone()[0]
        return {"inserted": inserted, "skipped": skipped, "total": total, "db_path": os.path.abspath(db_path)}
    finally:
        conn.close()

def run_ingest(csv_path="SB_publication_PMC.csv", db_path="studies.db", timeout=12.0, user_agent="Mozilla/5.0", sleep_secs=0.0):
    try:
        stats = ingest(
            csv_path=csv_path,
            db_path=db_path,
            timeout=timeout,
            user_agent=user_agent,
            sleep_secs=sleep_secs,
        )
        print(f"Ingest complete. Inserted: {stats['inserted']}, Skipped: {stats['skipped']}, Total in DB: {stats['total']}")
        print(f"Database: {stats['db_path']}")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    from time import time
    start = time()
    run_ingest()
    print(f"Done in {time() - start:.2f} seconds.")
