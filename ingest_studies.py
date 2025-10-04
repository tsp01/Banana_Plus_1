"""
Ingest PubMed Central (PMC) studies from a CSV into a local SQLite database.

This script reads a CSV containing study titles and links, optionally fetches
webpage metadata (publication date, journal, DOI) from each link, and writes the
results to a `studies` table in a SQLite database.

CSV expectations
----------------
- The CSV must contain a `title` column and/or a `link` column.
- If `title` is empty, `link` will be used as a fallback title.

SQLite schema
-------------
The table is created on demand if it does not exist:

    studies(
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        link TEXT,
        date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        journal TEXT,
        doi TEXT
    )

Usage
-----
From the command line (defaults shown):

    python ingest_studies.py \
        # CSV with columns: title, link
        --csv_path SB_publication_PMC.csv \
        # Output SQLite db path
        --db_path studies.db

Programmatic example:

    from ingest_studies import ingest
    stats = ingest(
        csv_path="SB_publication_PMC.csv",
        db_path="studies.db",
        timeout=12.0,
        user_agent="Mozilla/5.0",
        sleep_secs=0.0,
    )
    print(stats)

Notes
-----
- Metadata extraction targets common meta tag names used by PMC/publisher pages.
- Network calls are simple GET requests; consider adding retries/backoff for
  production use.
- No deduplication is performed; running multiple times may create duplicates
  unless the input contains unique titles/links and you enforce constraints.
"""

import csv
import os
import re
import sqlite3
import sys
import time
from urllib.parse import urlparse  # (Imported but currently unused)

import requests
from bs4 import BeautifulSoup

# ------------------------------------
# Constants and configuration helpers
# ------------------------------------

# UTF-8 Byte Order Mark. Some CSV headers exported from Excel/Sheets may begin
# with a BOM; we strip it when normalizing header names.
BOM = "\ufeff"

# Ordered list of meta tag names that might carry a publication date on publisher
# pages. These are normalized to lowercase before comparison.
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

# Regex for matching a 4-digit year in the 1900–2099 range.
YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")

# Ordered list of meta tag names that might carry a DOI.
DOI_PATTERNS = [
    "citation_doi",
    "dc.identifier",
    "dc.identifier.doi",
    "prism.doi",
    "doi",
]

# Ordered list of meta tag names that might carry a journal or venue name.
JOURNAL_META_NAMES = [
    "citation_journal_title",
    "prism.publicationname",
    "journal",
    "dc.source",
    "citation_conference_title",
]


def parse_year_from_string(s: str) -> int:
    """Extract a 4-digit year from an arbitrary string.

    Args:
        s: An input string that may contain a year.

    Returns:
        The year as an ``int`` if found; otherwise ``None``.
    """
    m = YEAR_RE.search(s)
    if not m:
        return None
    y = int(m.group(0))
    return y


def normalize_header(name: str) -> str:
    """Normalize a CSV header for robust matching.

    - Handles None by converting to an empty string.
    - Strips whitespace and a possible UTF-8 BOM.
    - Lowercases for case-insensitive matching.

    Args:
        name: Raw header name from the CSV file.

    Returns:
        A normalized header suitable for dictionary lookups.
    """
    return (name or "").strip().lstrip(BOM).lower()


def ensure_schema(conn: sqlite3.Connection) -> None:
    """Create the ``studies`` table and indexes if they do not exist.

    Args:
        conn: An open SQLite connection.
    """
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS studies (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            link TEXT,
            date TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            journal TEXT,
            doi TEXT
        );
    """
    )
    # Indexes facilitate fast lookups by year (via the `date` string) and title.
    cur.execute("CREATE INDEX IF NOT EXISTS idx_studies_year ON studies(date);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_studies_title ON studies(title);")
    conn.commit()


def fetch_html(url: str, timeout: float, user_agent: str) -> tuple[int, str]:
    """Fetch the raw HTML for a URL.

    Args:
        url: URL to retrieve.
        timeout: Request timeout in seconds.
        user_agent: Value for the ``User-Agent`` header.

    Returns:
        A tuple of (HTTP status code, response text).
    """
    headers = {"User-Agent": user_agent}
    resp = requests.get(url, headers=headers, timeout=timeout)
    return resp.status_code, resp.text


def soup_or_none(html: str):
    """Return a BeautifulSoup parser for the given HTML, or ``None`` on error.

    This helper is intentionally lenient—any parsing exception returns ``None``
    rather than raising.
    """
    if BeautifulSoup is None:
        return None
    try:
        return BeautifulSoup(html, "html.parser")
    except Exception:
        return None


def meta_get_all(soup, names_lower: list[str]) -> list[str]:
    """Collect the ``content`` values of meta tags whose name/property matches.

    Args:
        soup: A BeautifulSoup document.
        names_lower: A list of lowercase meta names/properties to filter on.

    Returns:
        A list of non-empty ``content`` strings in document order.
    """
    vals = []
    for tag in soup.find_all("meta"):
        name = (tag.get("name") or tag.get("property") or "").strip().lower()
        if name in names_lower:
            content = tag.get("content") or ""
            if content:
                vals.append(content.strip())
    return vals


def first_nonempty(*vals):
    """Return the first non-empty string from ``vals`` (stripped), else ``None``."""
    for v in vals:
        if isinstance(v, str) and v.strip():
            return v.strip()
    return None


def extract_metadata_pmc(html: str) -> dict:
    """Extract a minimal metadata set from PMC/publisher-like HTML.

    This function looks for publication date, year, journal, and DOI by scanning
    common meta tag patterns found on PMC/publisher pages. If a year is not
    present in meta tags, it falls back to searching in a "front"/``header``
    region of the page.

    Args:
        html: The HTML string to parse.

    Returns:
        A dictionary with keys ``date`` (raw), ``year`` (int or None),
        ``journal`` (str or None), and ``doi`` (str or None).
    """
    soup = soup_or_none(html)

    # Pull possible date strings from common meta tag names.
    raw_date = first_nonempty(*meta_get_all(soup, [
        "citation_publication_date", "citation_date", "dc.date"
    ]))
    year = parse_year_from_string(raw_date or "")

    # Journal and DOI from common meta tags.
    journal = first_nonempty(*meta_get_all(soup, ["citation_journal_title"]))
    doi = first_nonempty(*meta_get_all(soup, ["citation_doi"]))

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
    }


def get_or_fetch_metadata(url: str, timeout: float, user_agent: str, sleep_secs: float) -> dict:
    """Fetch page HTML and extract publication metadata with gentle pacing.

    Args:
        url: The page to fetch.
        timeout: Request timeout in seconds.
        user_agent: User-Agent header to send with the request.
        sleep_secs: Optional delay (seconds) after the request to avoid hammering
            servers when ingesting large CSVs.

    Returns:
        A metadata dictionary with keys ``date``, ``year``, ``journal``, ``doi``.
        Errors result in ``None`` values for these keys.
    """

    try:
        status, html = fetch_html(url, timeout=timeout, user_agent=user_agent)
        meta = extract_metadata_pmc(html)
        if status != 200:
            print(f"Code: {status} for URL: {url}")
        if sleep_secs > 0:
            time.sleep(sleep_secs)
        return meta
    except Exception as e:
        # Keep behavior identical to original, including the message text.
        print("definitiely not my prblem")
        return {"raw_date": None, "year": None, "journal": None, "doi": None}


def upsert_row(conn: sqlite3.Connection, row: dict) -> bool:
    """Insert a study row. (Simple insert; no conflict handling.)

    Args:
        conn: Open SQLite connection.
        row: Mapping with keys ``title``, ``link``, ``date``, ``journal``, ``doi``.

    Returns:
        True if a row was inserted (``rowcount > 0``), else False.

    Note:
        This function does not perform an upsert/replace on conflict; it always
        executes a plain ``INSERT``. Duplicate detection is not implemented.
    """
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO studies (title, link, date, journal, doi)
        VALUES (:title, :link, :date, :journal, :doi)
        """,
        row,
    )
    conn.commit()
    return cur.rowcount > 0


def ingest(csv_path: str, db_path: str, timeout: float, user_agent: str, sleep_secs: float) -> dict:
    """Ingest studies from a CSV file into a SQLite database.

    The CSV is read using ``csv.DictReader`` with ``utf-8-sig`` encoding to
    gracefully handle files that include a BOM. For each row, the function
    optionally fetches metadata from the ``link`` URL and inserts a row into
    ``studies``.

    Args:
        csv_path: Path to the input CSV.
        db_path: Path to the SQLite database file (created if missing).
        timeout: HTTP request timeout when fetching metadata.
        user_agent: User-Agent string for HTTP requests.
        sleep_secs: Delay between requests to be polite to remote servers.

    Returns:
        A dict of ingestion statistics with keys:
            - ``inserted``: Number of rows successfully inserted.
            - ``skipped``: Number of rows skipped (e.g., missing title/link).
            - ``total``: Total rows present in the database after ingest.
            - ``db_path``: Absolute path to the SQLite database.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    conn = sqlite3.connect(db_path)
    try:
        ensure_schema(conn)
        inserted = 0
        skipped = 0

        # ``utf-8-sig`` removes an initial BOM if present. ``newline=\"\"``
        # avoids universal newline translation issues on Windows.
        with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)

            # Build a mapping from normalized header -> original header so that
            # we can tolerate case/BOM differences in the input file.
            field_map = {normalize_header(h): h for h in reader.fieldnames or []}

            title_key = field_map.get("title")
            link_key = field_map.get("link")

            for raw in reader:
                title = (raw.get(title_key) or "").strip()
                link = (raw.get(link_key) or "").strip()

                # Skip rows that contain neither a title nor a link.
                if not title and not link:
                    skipped += 1
                    continue

                # Fallback: if a title is missing, use the link as the title.
                if not title:
                    title = link

                # Default metadata shape; will be updated if we can fetch.
                meta = {"date": None, "year": None, "journal": None, "doi": None}
                if link:
                    meta = get_or_fetch_metadata(
                        link, timeout=timeout, user_agent=user_agent, sleep_secs=sleep_secs
                    )

                success = upsert_row(
                    conn,
                    {
                        "title": title,
                        "link": link or None,
                        "date": meta.get("date"),
                        "journal": meta.get("journal"),
                        "doi": meta.get("doi"),
                    },
                )
                if success:
                    inserted += 1
                else:
                    skipped += 1
                    print("Ingested " + str(title))

        # Sanity check / final tally from the database.
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM studies;")
        total = cur.fetchone()[0]
        return {
            "inserted": inserted,
            "skipped": skipped,
            "total": total,
            "db_path": os.path.abspath(db_path),
        }
    finally:
        conn.close()


def run_ingest(
    csv_path: str = "SB_publication_PMC.csv",
    db_path: str = "studies.db",
    timeout: float = 12.0,
    user_agent: str = "Mozilla/5.0",
    sleep_secs: float = 0.0,
) -> None:
    """CLI-friendly wrapper around :func:`ingest`.

    Prints a brief summary and exits with a non-zero status code on error.
    """
    try:
        stats = ingest(
            csv_path=csv_path,
            db_path=db_path,
            timeout=timeout,
            user_agent=user_agent,
            sleep_secs=sleep_secs,
        )
        print(
            f"Ingest complete. Inserted: {stats['inserted']}, Skipped: {stats['skipped']}, Total in DB: {stats['total']}"
        )
        print(f"Database: {stats['db_path']}")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    from time import time
    start = time()
    run_ingest()
    print(f"Done in {time() - start:.2f} seconds.")
