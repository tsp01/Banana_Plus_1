# Banana_Plus_1

A small toolset for ingesting study metadata (from CSV + web pages / PMC), extracting readable text/abstracts, building a searchable embeddings index, and exposing a minimal search API. A simple React/Vite frontend lives in `Page/` and can be used to browse/search papers.

## Quick summary

- `ingest_studies.py` — Reads a CSV (default `SB_publication_PMC.csv`) and upserts rows into `studies.db`, attempting to fetch metadata (date, journal, doi, authors, PMID, citation count) from linked pages.
- `build_abstracts_db.py` — Reads `studies.db`, fetches full text/PMC XML if possible, extracts readable text and abstracts using `extract_study_text.py` / `extract_sections.py`, and writes `studies_abstracts.db`.
- `sim_search.py` — Builds sentence embeddings (SentenceTransformers) over titles+abstracts, stores embeddings in `embeddings.pkl` and a FAISS index (`faiss.index`), and provides a `search()` function/CLI to query similar papers.
- `user_query.py` — Minimal FastAPI wrapper exposing `/search` which returns titles from `sim_search.search`.
- `Page/` — A Vite + React frontend to visualize/browse results.

## Requirements

- Python 3.11.x+ 
- Node.js + npm (for the frontend in `Page/`)
- Recommended: a virtual environment (venv/conda)

Python libraries: core list in `requirements.txt`:

Additional Python packages required for search/embedding (not listed in `requirements.txt` but required to use `sim_search.py`):
- sentence-transformers
- torch (a backing framework for sentence-transformers)
- faiss-cpu (or faiss, depending on your setup)
- numpy

Note: installing `faiss` can be system-dependent; see Troubleshooting below.

## Environment variables

The code reads some optional environment variables (use a `.env` file or export in your shell):

- `NCBI_API_KEY` — (optional) NCBI E-utilities API key to increase rate limits when fetching PMC XML.
- `NCBI_EMAIL` — (optional) email address given to NCBI requests.
- `SENTENCE_TRANSFORMER_MODEL` — (optional) sentence-transformers model name. Defaults to `all-MiniLM-L6-v2`.

Create a `.env` in the project root for convenience:
```
NCBI_API_KEY=your_key_here
NCBI_EMAIL=you@example.com
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
```

## Install (Python)

Create and activate a venv, then install requirements and extras:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If `faiss-cpu` fails on macOS, see Troubleshooting (conda alternative).

## Install (frontend)

From the project root:

```bash
cd Page
npm install
# start dev server
npm run dev
```

`Page/` contains a Vite React app. Use `npm run loadDB` to run the included TypeScript helper that can generate a client-side database (`npx tsx src/data/generatePapers.ts`).

## Typical workflow / Usage

1. Ingest CSV into `studies.db` (default CSV: `SB_publication_PMC.csv`)

```bash
python ingest_studies.py
# or, to specify files:
python -c "import ingest_studies as i; i.run_ingest(csv_path='SB_publication_PMC.csv', db_path='studies.db')"
```

2. Build abstracts DB (`studies_abstracts.db`) from `studies.db`

```bash
python build_abstracts_db.py
```

This will fetch PMC XML where possible and extract plain text and an `abstract` field into `studies_abstracts.db`.

3. Build embeddings / FAISS index and run a quick search

- Running `sim_search.py` as-is runs a query (configurable in the script). To use interactively, import `sim_search.search()` from a Python REPL or edit the script's `__main__` block.

```bash
# quick test / CLI usage (script prints results by default)
python sim_search.py
```

Notes:
- Embeddings are cached to `embeddings.pkl`. The FAISS index is saved to `faiss.index`.
- To rebuild embeddings/index, remove `embeddings.pkl` and `faiss.index` or set the `rebuild` flag in the script.

4. Run the minimal search API (FastAPI)

```bash
python user_query.py
# or using uvicorn for autoreload:
uvicorn user_query:app --reload --port 8453
```

POST to `/search` with JSON:
```json
{
	"searchQuery": "bone loss in microgravity",
	"k": 10,
	"threshold": 0.4
}
```
Returns a list of matching titles (or `["No results found."]`).

5. Frontend

- Start the dev server in `Page/` and point your browser to the Vite dev URL (usually `http://localhost:5173`).

## File overview

- `SB_publication_PMC.csv` — input CSV used by default by `ingest_studies.py`.
- `ingest_studies.py` — CSV ingestion + metadata fetch (creates/updates `studies.db`).
- `build_abstracts_db.py` — fetches page/PMC content and writes `studies_abstracts.db`.
- `extract_study_text.py` — helper to get article text (used by `build_abstracts_db.py`).
- `extract_sections.py` — splits text into sections (abstract, intro, methods, etc).
- `sim_search.py` — embeddings, FAISS index, and search helper.
- `user_query.py` — FastAPI wrapper exposing `/search`.
- `summary.py` — placeholder for summarization utilities.
- `Page/` — Vite + React frontend and TypeScript helpers.

## Contract / expected inputs & outputs

- ingest_studies.ingest(csv_path, db_path, ...):
	- Inputs: CSV with at least `title` or `link`.
	- Outputs: populates `studies.db` and returns stats dict {"inserted", "skipped", "total", "db_path"}.

- build_abstracts_db.build(src_db_path, out_db_path):
	- Inputs: `studies.db`
	- Outputs: `studies_abstracts.db` with columns (id, url, title, abstract, hash)

- sim_search.search(query, k, threshold, rebuild):
	- Inputs: text query and parameters
	- Outputs: list of candidate dicts with `id`, `title`, `url`, `score`, etc.

Edge cases to watch:
- Missing/invalid URLs in CSV rows.
- Pages that block scraping or return rate-limiting (429).
- PMC XML fetch errors (falls back to page scraping).
- `faiss` install/import failures.
- Mismatch between cached embeddings and DB rows — `ensure_embeddings()` checks for equal length and will recompute if lengths differ.

## Troubleshooting

- faiss installation problems:
	- pip approach (try first):
		```bash
		pip install faiss-cpu
		```
	- conda approach (often more reliable):
		```bash
		conda install -c pytorch -c conda-forge faiss-cpu
		```
- sentence-transformers requires a torch backend:
	```bash
	pip install torch
	pip install sentence-transformers
	```
	Choose the correct `torch` wheel for your macOS / CPU / GPU configuration if necessary (see https://pytorch.org/get-started/locally/).

- If embedding/search returns no results: check that `studies_abstracts.db` contains rows, that `embeddings.pkl` and `faiss.index` exist and that threshold/k parameters are appropriate.

- If NCBI requests are rate-limited, set `NCBI_API_KEY` and `NCBI_EMAIL` in `.env` and restart.

## Next steps / suggestions

- No need, we are always perfect the first time

## License

No license specified. Add a LICENSE file if you want to open-source this.

# Nplus1_Change_name_later

