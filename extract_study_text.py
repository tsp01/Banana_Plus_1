import os
import re
import time
import sys
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

# Retrieve API credentials for NCBI
NCBI_API_KEY = os.getenv("NCBI_API_KEY")
NCBI_EMAIL = os.getenv("NCBI_EMAIL")

# Base URL for NCBI Entrez E-utilities
EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

# Custom request headers (NCBI requires user agent to include contact email)
HEADERS = {
    "User-Agent": f"StudyTextExtractor/1.0 (+{NCBI_EMAIL})",
    "Accept": "application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
}

# Regex pattern to detect PMC identifiers (e.g., PMC123456)
PMCID_RE = re.compile(r"\bPMC([0-9]+)\b", re.I)


def fetch_pmc_xml(pmcid: str, email: str, api_key: str) -> str:
    """
    Fetches full-text article XML from PubMed Central (PMC) using NCBI E-utilities.

    Args:
        pmcid (str): The numeric PMC identifier (without 'PMC' prefix).
        email (str): Registered email address for NCBI API.
        api_key (str): NCBI API key.

    Returns:
        str: Raw XML string of the requested article.
    """
    params = {
        "db": "pmc",
        "id": pmcid,
        "retmode": "xml",
        "email": email,
        "api_key": api_key,
    }

    r = requests.get(f"{EUTILS_BASE}/efetch.fcgi", params=params, headers=HEADERS, timeout=60)
    r.raise_for_status()
    return r.text


def extract_abstract_from_jats(soup) -> str:
    """
    Extracts abstract text from JATS XML format used in PMC articles.

    Args:
        soup (BeautifulSoup): Parsed JATS XML soup.

    Returns:
        str: Cleaned abstract text (multiple abstracts concatenated).
    """
    abstracts = []

    for abs_tag in soup.find_all("abstract"):
        # Skip non-standard abstracts
        if abs_tag.get("abstract-type") in {"graphical", "teaser"}:
            continue

        parts = []
        title = abs_tag.find("title", recursive=False)
        if title:
            parts.append(clean_inline(title.get_text(" ", strip=True)))

        # Handle structured abstracts with <sec> tags
        secs = abs_tag.find_all("sec", recursive=False)
        if secs:
            for sec in secs:
                stitle = sec.find("title", recursive=False)
                if stitle:
                    parts.append(f"**{clean_inline(stitle.get_text(' ', strip=True))}**")
                for p in sec.find_all("p", recursive=False):
                    txt = clean_inline(p.get_text(" ", strip=True))
                    if txt:
                        parts.append(txt)
        else:
            # Handle unstructured abstracts (paragraphs only)
            for p in abs_tag.find_all("p", recursive=False):
                txt = clean_inline(p.get_text(" ", strip=True))
                if txt:
                    parts.append(txt)

        text = "\n".join(parts).strip()
        if text:
            abstracts.append(text)

    return "\n\n".join(abstracts).strip()


def jats_to_text(jats_xml: str) -> str:
    """
    Converts JATS XML into plain text with Markdown-like formatting.

    Args:
        jats_xml (str): Raw JATS XML string.

    Returns:
        str: Cleaned human-readable article text (title, abstract, body, references).
    """
    soup = BeautifulSoup(jats_xml, "lxml-xml")
    article = soup.find(["article", "pmc-articleset"])
    if not article:
        # Fallback: dump plain text if JATS parsing fails
        return BeautifulSoup(jats_xml, "lxml").get_text(separator="\n").strip()

    parts = []

    # Extract title
    title = article.find("article-title")
    if title:
        parts.append(clean_inline(title.get_text(" ", strip=True)))
        parts.append("=" * 80)

    # Extract abstract
    abstract_text = extract_abstract_from_jats(soup)
    if abstract_text:
        parts.append("ABSTRACT")
        parts.append("-" * 80)
        parts.append(abstract_text)
        parts.append("")

    # Extract body sections
    body = article.find("body") or article
    sec_chunks = []
    for sec in body.find_all("sec", recursive=False):
        sec_chunks.append(render_sec(sec, level=1))
    if not sec_chunks:
        # Handle flat text-only articles
        for p in body.find_all("p", recursive=False):
            txt = clean_inline(p.get_text(" ", strip=True))
            if txt:
                sec_chunks.append(txt)
    if sec_chunks:
        parts.append("\n\n".join(sec_chunks).strip())

    # Extract references if available
    refs = soup.find("ref-list")
    if refs:
        parts.append("\nReferences")
        parts.append("-" * 80)
        for li in refs.find_all(["ref"], recursive=False):
            ref_txt = clean_inline(li.get_text(" ", strip=True))
            if ref_txt:
                parts.append(ref_txt)

    return "\n\n".join(filter(None, parts)).strip()


def render_sec(sec_tag, level=1) -> str:
    """
    Recursively renders article sections (<sec>) into Markdown-like text.

    Args:
        sec_tag (Tag): A <sec> tag.
        level (int): Current depth (for heading levels).

    Returns:
        str: Section text with nested subsections.
    """
    chunks = []
    title = sec_tag.find("title", recursive=False)
    if title:
        prefix = "#" * min(level + 1, 6)  # Markdown heading levels
        chunks.append(f"{prefix} {clean_inline(title.get_text(' ', strip=True))}")

    # Extract paragraphs
    for p in sec_tag.find_all("p", recursive=False):
        txt = clean_inline(p.get_text(" ", strip=True))
        if txt:
            chunks.append(txt)

    # Extract figure and table captions
    for cap in sec_tag.find_all(["fig", "table-wrap"], recursive=False):
        label = cap.find(["label", "caption"])
        if label:
            caption_text = clean_inline(label.get_text(" ", strip=True))
            if caption_text:
                chunks.append(caption_text)

    # Recursively process nested subsections
    for child_sec in sec_tag.find_all("sec", recursive=False):
        chunks.append(render_sec(child_sec, level=level + 1))

    return "\n\n".join(chunks).strip()


def clean_inline(s: str) -> str:
    """
    Cleans inline text by collapsing excess whitespace.

    Args:
        s (str): Input text.

    Returns:
        str: Cleaned single-line string.
    """
    return re.sub(r"[ \t]+", " ", s).strip()


def pubmed_xml_to_abstract_text(pubmed_xml: str) -> str:
    """
    Extracts title and abstract from PubMed XML format.

    Args:
        pubmed_xml (str): Raw PubMed XML.

    Returns:
        str: Title and abstract text.
    """
    soup = BeautifulSoup(pubmed_xml, "lxml-xml")
    art = soup.find("PubmedArticle")
    if not art:
        return ""

    title = art.find("ArticleTitle")
    abstract = art.find("Abstract")

    title_txt = title.get_text(" ", strip=True) if title else ""
    abs_paras = []
    if abstract:
        for ab in abstract.find_all(["AbstractText"]):
            label = ab.get("Label") or ab.get("NlmCategory")
            para = ab.get_text(" ", strip=True)
            if label:
                abs_paras.append(f"{label}: {para}")
            else:
                abs_paras.append(para)

    out = []
    if title_txt:
        out.append(title_txt)
        out.append("=" * 80)
    if abs_paras:
        out.append("\n\n".join(abs_paras))

    return "\n\n".join(out).strip()


def extract_text(entry: str, email: str, api_key: str):
    """
    Extracts full-text from a PMC article entry.

    Args:
        entry (str): String containing PMC URL or ID.
        email (str): Registered email for NCBI API.
        api_key (str): NCBI API key.

    Returns:
        tuple: (source type, extracted text)
    """
    s = entry.strip()
    m = PMCID_RE.search(s)
    ident = m.group(1)  # Extract numeric part of PMC ID
    xml = fetch_pmc_xml(ident, email, api_key)
    return "pmc-fulltext", jats_to_text(xml)


def get_text(url: str, email: str, api_key: str):
    """
    Top-level function to retrieve and print article text from PMC.

    Args:
        url (str): PMC article URL or ID.
        email (str): Registered email.
        api_key (str): NCBI API key.

    Returns:
        str: Extracted article text.
    """
    try:
        source, text = extract_text(url, email, api_key)
        print(f"[source={source}]")
        print(text)
        return text
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Example: fetch a real PMC article by URL
    text = get_text("https://pmc.ncbi.nlm.nih.gov/articles/PMC4136787/", NCBI_EMAIL, NCBI_API_KEY)
    print("done")
