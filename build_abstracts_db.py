import os
import re
import sqlite3
import sys
import time
from typing import Optional

import requests
from bs4 import BeautifulSoup
from extract_study_text import get_text
from extract_sections import extract_sections
from dotenv import load_dotenv
load_dotenv()


NCBI_API_KEY = os.getenv("NCBI_API_KEY")
NCBI_EMAIL = os.getenv("NCBI_EMAIL")
EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

PMCID_RE = re.compile(r"\bPMC([0-9]+)\b", re.I)

def fetch_pmc_xml(pmcid: str, email: Optional[str], api_key: Optional[str]) -> str:
    params = {"db": "pmc", "id": pmcid, "retmode": "xml"}
    if email:
        params["email"] = email
    if api_key:
        params["api_key"] = api_key

    r = requests.get(f"{EUTILS_BASE}/efetch.fcgi", params=params, timeout=60)
    r.raise_for_status()
    return r.text


def jats_to_text(jats_xml: str) -> str:
    # Minimal conversion: extract readable text from XML
    soup = BeautifulSoup(jats_xml, "lxml-xml")
    return soup.get_text(separator="\n").strip()


def fetch_html(url: str, timeout: float = 20.0) -> tuple[int, str]:
    headers = {"User-Agent": "build_abstracts_db/1.0"}
    resp = requests.get(url, headers=headers, timeout=timeout)
    if resp.status_code != 200:
        # one retry
        time.sleep(1)
        resp = requests.get(url, headers=headers, timeout=timeout)
    return resp.status_code, resp.text


def extract_text_from_url(url: str) -> str:
    """Fetches text for a given URL. If it's a PMC id/url, uses EFetch to get XML.

    Returns plain text suitable for `extract_sections()`.
    """
    if not url:
        return ""

    # Check for PMC ID in the url
    m = PMCID_RE.search(url)
    if m:
        pmcid = m.group(1)
        try:
            xml = fetch_pmc_xml(pmcid, NCBI_EMAIL, NCBI_API_KEY)
            return jats_to_text(xml)
        except Exception:
            # fall back to fetching the page HTML
            pass

    try:
        status, html = fetch_html(url)
        if status != 200:
            return ""
        # Parse HTML and return visible text
        soup = BeautifulSoup(html, "html.parser")
        # Remove scripts/styles
        for s in soup(["script", "style", "noscript"]):
            s.extract()
        text = soup.get_text(separator="\n")
        return text.strip()
    except Exception:
        return ""


def ensure_out_schema(conn: sqlite3.Connection):
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS studies_abstracts (
            id INTEGER PRIMARY KEY,
            url TEXT,
            title TEXT,
            abstract TEXT,
            hash TEXT
        );
        """
    )
    cur.execute("CREATE INDEX IF NOT EXISTS idx_abs_url ON studies_abstracts(url);")
    conn.commit()


def build(src_db_path: str = "studies.db", out_db_path: str = "studies_abstracts.db"):
    if not os.path.exists(src_db_path):
        print(f"Source DB not found: {src_db_path}")
        sys.exit(1)

    src = sqlite3.connect(src_db_path)
    out = sqlite3.connect(out_db_path)
    try:
        ensure_out_schema(out)

        src_cur = src.cursor()
        out_cur = out.cursor()

        src_cur.execute("SELECT id, title, link, hash FROM studies;")
        rows = src_cur.fetchall()
        print(f"Found {len(rows)} rows in source DB")

        inserted = 0
        for row in rows:
            sid, title, link, hash_val = row
            title = title or ""
            link = link or ""

            # Fetch text and extract abstract
            text = get_text(link, NCBI_EMAIL, NCBI_API_KEY)
            sections = extract_sections(text)


            abstract = sections.get("abstract")

            out_cur.execute(
                "INSERT OR REPLACE INTO studies_abstracts (id, url, title, abstract, hash) VALUES (?, ?, ?, ?, ?);",
                (sid, link, title, abstract, hash_val),
            )
            inserted += 1
            if inserted % 50 == 0:
                out.commit()

        out.commit()
        print(f"Inserted/updated {inserted} rows into {out_db_path}")
    finally:
        src.close()
        out.close()


if __name__ == "__main__":
    src = "studies.db"
    out = "studies_abstracts.db"
    build(src, out)
    print("done")