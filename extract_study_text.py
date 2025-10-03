import os
import re
import time
import sys
import requests
from bs4 import BeautifulSoup

from dotenv import load_dotenv
load_dotenv()

NCBI_API_KEY = os.getenv("NCBI_API_KEY")
NCBI_EMAIL = os.getenv("NCBI_EMAIL")

EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

#Weird way to do this NCBI
HEADERS =  {
    "User-Agent": f"StudyTextExtractor/1.0 (+{NCBI_EMAIL})",
    "Accept": "application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
}

PMCID_RE = re.compile(r"\bPMC([0-9]+)\b", re.I)


def fetch_pmc_xml(pmcid: str, email: str, api_key: str) -> str:
    params = {
        "db": "pmc",
        "id": pmcid,
        "retmode": "xml",
        "email": email,
    }

    params["api_key"] = api_key
    r = requests.get(f"{EUTILS_BASE}/efetch.fcgi", params=params, headers=HEADERS, timeout=60)
    r.raise_for_status()
    return r.text

def extract_abstract_from_jats(soup) -> str:
    #NCBI is nonsense, this format is nonsense, we should get rid of computers

    abstracts = []
    for abs_tag in soup.find_all("abstract"):

        if abs_tag.get("abstract-type") in {"graphical", "teaser"}:
            continue

        parts = []
        title = abs_tag.find("title", recursive=False)
        if title:
            parts.append(clean_inline(title.get_text(" ", strip=True)))

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
            for p in abs_tag.find_all("p", recursive=False):
                txt = clean_inline(p.get_text(" ", strip=True))
                if txt:
                    parts.append(txt)

        text = "\n".join(parts).strip()
        if text:
            abstracts.append(text)

    return "\n\n".join(abstracts).strip()

def jats_to_text(jats_xml: str) -> str:
    soup = BeautifulSoup(jats_xml, "lxml-xml")
    article = soup.find(["article", "pmc-articleset"])
    if not article:
        return BeautifulSoup(jats_xml, "lxml").get_text(separator="\n").strip()

    parts = []

    title = article.find("article-title")
    if title:
        parts.append(clean_inline(title.get_text(" ", strip=True)))
        parts.append("=" * 80)

    abstract_text = extract_abstract_from_jats(soup)
    if abstract_text:
        parts.append("ABSTRACT")
        parts.append("-" * 80)
        parts.append(abstract_text)
        parts.append("")

    # code is self documenting, get someone else to write useful comments
    body = article.find("body") or article
    sec_chunks = []
    for sec in body.find_all("sec", recursive=False):
        sec_chunks.append(render_sec(sec, level=1))
    if not sec_chunks:
        for p in body.find_all("p", recursive=False):
            txt = clean_inline(p.get_text(" ", strip=True))
            if txt:
                sec_chunks.append(txt)
    if sec_chunks:
        parts.append("\n\n".join(sec_chunks).strip())

    # References, maybe works
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
    chunks = []
    title = sec_tag.find("title", recursive=False)
    if title:
        prefix = "#" * min(level + 1, 6)  # markdownish
        chunks.append(f"{prefix} {clean_inline(title.get_text(' ', strip=True))}")

    for p in sec_tag.find_all("p", recursive=False):
        txt = clean_inline(p.get_text(" ", strip=True))
        if txt:
            chunks.append(txt)

    # Figures/tables captions not sure if this is actually useful, probably not
    for cap in sec_tag.find_all(["fig", "table-wrap"], recursive=False):
        label = cap.find(["label", "caption"])
        if label:
            caption_text = clean_inline(label.get_text(" ", strip=True))
            if caption_text:
                chunks.append(caption_text)

    for child_sec in sec_tag.find_all("sec", recursive=False):
        chunks.append(render_sec(child_sec, level=level + 1))

    return "\n\n".join(chunks).strip()

def clean_inline(s: str) -> str:
    return re.sub(r"[ \t]+", " ", s).strip()

def pubmed_xml_to_abstract_text(pubmed_xml: str) -> str:
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
    s = entry.strip()
    m = PMCID_RE.search(s)
    ident = m.group(1)
    xml = fetch_pmc_xml(ident, email, api_key)
    return "pmc-fulltext", jats_to_text(xml)

def get_text(url: str, email: str, api_key: str):
    

    try:
        source, text = extract_text(url, email, api_key)
        print(f"[source={source}]")
        print(text)
        return text
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    text = get_text("https://pmc.ncbi.nlm.nih.gov/articles/PMC4136787/", NCBI_EMAIL, NCBI_API_KEY)
    print(text)
    print("done")
