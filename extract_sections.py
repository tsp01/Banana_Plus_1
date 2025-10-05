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

def extract_sections(text: str) -> dict:
    """
    Splits a full article text into sections based on heading variants.

    Args:
        text (str): The full article text (plain).
        heading_variants (dict): Mapping of normalized section names to regex heading variants.

    Returns:
        dict: {section_name: text_content}
    """
    # Flatten all variants into a single regex mapping
    compiled_patterns = {
        key: [re.compile(rf"^\s*(?:#{{1,6}}\s*)?({variant})\s*$", re.I) for variant in variants]
        for key, variants in HEADING_VARIANTS.items()
    }

    sections = {}
    current_section = "title"
    sections[current_section] = []

    for line in text.splitlines():
        stripped = re.sub(r"[-=]{3,}", "", line).strip()
        if not stripped:
            continue

        matched_section = None
        for sec_name, regexes in compiled_patterns.items():
            if any(r.match(stripped) for r in regexes):
                matched_section = sec_name
                break

        if matched_section:
            current_section = matched_section
            if current_section not in sections:
                sections[current_section] = []
        elif current_section is None:
            # Skip lines until we find a section
            continue
        else:
            sections[current_section].append(stripped)
            if current_section == "title":
                current_section = None

    for sec in sections:
        sections[sec] = "\n".join(sections[sec]).strip()

    return sections