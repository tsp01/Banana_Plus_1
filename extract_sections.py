import re
from typing import Dict, List

HEADING_VARIANTS = {
        "abstract": [
            r"abstract",
            r"summary",
            r"author summary"
        ],
        "intro": [
            r"introduction",
            r"background",
            r"overview",
            r"literature\s+review",
            r"gaps",
            r"gaps\s+in\s+literature"
        ],
        "methods": [
            r"methods",
            r"materials\s+(and|&)\s+methods",
            r"methods\s+(and|&)\s+materials",
            r"methodology",
            r"procedures?",
            r"materials/methods",
            r"methods/materials",
            r"experimental\s+plan"
        ],
        "results": [
            r"results",
            r"data",
            r"data\s+collected"
        ],
        "discussion": [
            r"analysis",
            r"discussion",
            r"results\s+(and|&)\s+discussions?",
            r"discussion\s+(and|&)\s+conclusions?",
            r"results/discussions?"
        ],
        "conclusion": [
            r"conclusion",
            r"conclusions",
            r"concluding\s+remarks",
            r"final\s+remarks",
            r"significance",
            r"clinical\s+relevance",
            r"relevance",
            r"implications"
        ],
        "limitations": [
            r"study\s+limitations"
        ],
        "acknowledgements": [
            r"acknowledgements",
            r"conflicts\s+of\s+interest",
            r"conflict\s+of\s+interest",
            r"funding\s+statement",
            r"funding",
            r"footnote",
            r"footnotes",
            r"competing\s+interests",
            r"competing\s+interest",
            r"contributor\s+information"
        ],
        "refs": [
            r"references",
            r"bibliography",
            r"literature\s+cited",
            r"works\s+cited"
        ],
        "appendix": [
            r"appendix",
            r"appendices",
            r"supplementary\s+material"
        ],
        "keywords": [
            r"keywords",
            r"index\s+terms",
            r"key-terms",
            r"subject-terms",
            r"subject\s+terms"
        ]
    }

def _build_compiled_variants(heading_variants: Dict[str, List[str]]):
    """Compile anchored regex per variant for line-by-line heading detection."""
    compiled = []
    for section, variants in heading_variants.items():
        for v in variants:
            pat = re.compile(
                rf"^\s*"
                rf"(?:\d+\s*[\.\)]\s*|[ivxlcdm]+\s*[\.\)]\s*)?"  # optional numbering
                rf"(?:#+\s*)?"                                   # optional markdown hashes
                rf"(?:{v})"
                rf"(?:\s*[:\-–—])?\s*$",                         # optional trailing colon/dash
                re.IGNORECASE,
            )
            compiled.append((section, v, pat))
    # Prefer more specific (longer) variants first (e.g., 'results and discussion' before 'results')
    compiled.sort(key=lambda t: len(t[1]), reverse=True)
    return compiled

def extract_sections(article_text: str, heading_variants=HEADING_VARIANTS) -> Dict[str, str]:
    """Return {section_key: text} for all keys in heading_variants (empty string if missing)."""
    lines = article_text.splitlines(keepends=True)

    # Precompute char offsets for each line start to slice original text later
    starts = []
    pos = 0
    for ln in lines:
        starts.append(pos)
        pos += len(ln)

    compiled = _build_compiled_variants(heading_variants)

    # Find heading lines; take the most specific match per line
    headings = []
    for i, raw_line in enumerate(lines):
        line = raw_line.rstrip("\n")
        for section, variant, pat in compiled:
            if pat.fullmatch(line.strip()):
                headings.append((i, section))
                break

    # Prepare output dict with all keys present
    out: Dict[str, str] = {k: "" for k in heading_variants.keys()}

    def is_delim(l: str) -> bool:
        s = l.strip()
        return len(s) >= 3 and all(ch in "-=_~*" for ch in s)

    # Slice content between headings
    for idx, (line_no, section) in enumerate(headings):
        # start after heading (skip any immediate underline like "-----")
        start_line = line_no + 1
        while start_line < len(lines) and is_delim(lines[start_line]):
            start_line += 1
        start = starts[start_line] if start_line < len(starts) else len(article_text)

        end = starts[headings[idx + 1][0]] if idx + 1 < len(headings) else len(article_text)
        chunk = article_text[start:end].strip()
        if not chunk:
            continue
        out[section] = (out[section] + ("\n\n" if out[section] else "") + chunk)

    return out

# Example usage:
if __name__ == "__main__":
    with open("tst.txt", "r", encoding="utf-8") as f:
        article_text = f.read()

    sections = extract_sections(article_text, HEADING_VARIANTS)

    for key, value in sections.items():
        print(f"\n--- {key.upper()} ---\n{value[:500]}...\n")