import os
import sqlite3
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import pickle
from typing import List, Dict, Any

DB_PATH = "studies_abstracts.db"
EMBED_CACHE = "embeddings.pkl"
INDEX_PATH = "faiss.index"
MODEL_NAME = os.getenv("SENTENCE_TRANSFORMER_MODEL", "all-MiniLM-L6-v2")


def load_rows(db_path: str = DB_PATH) -> List[Dict[str, Any]]:
	conn = sqlite3.connect(db_path)
	cur = conn.cursor()
	cur.execute("SELECT id, url, title, abstract, hash FROM studies_abstracts;")
	rows = []
	for r in cur.fetchall():
		rows.append({"id": r[0], "url": r[1], "title": r[2], "abstract": r[3], "hash": r[4] if len(r) > 4 else None})
	conn.close()
	return rows


def ensure_embeddings(rows, model_name: str = MODEL_NAME, cache_path: str = EMBED_CACHE):
    if os.path.exists(cache_path):
        with open(cache_path, "rb") as f:
            data = pickle.load(f)
        if len(data["rows"]) == len(rows):
            return data["embeddings"], data["rows"]

    model = SentenceTransformer(model_name)
    texts = [((r.get("title") or "") + "\n" + (r.get("abstract") or "")).strip() for r in rows]
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)

    with open(cache_path, "wb") as f:
        pickle.dump({"rows": rows, "embeddings": embeddings}, f)

    return embeddings, rows



def build_faiss_index(embeddings: np.ndarray, index_path: str = INDEX_PATH):
	d = embeddings.shape[1]
	index = faiss.IndexFlatIP(d) 

	faiss.normalize_L2(embeddings)
	index.add(embeddings)
	faiss.write_index(index, index_path)
	return index


def load_faiss_index(index_path: str, dim: int):
	if os.path.exists(index_path):
		return faiss.read_index(index_path)
	return None


def search(query: str, k: int = 10, threshold: float = 0.5, rebuild: bool = False) -> List[Dict[str, Any]]:
	
	rows = load_rows(DB_PATH)
	if not rows:
		return []

	embeddings, rows_back = ensure_embeddings(rows)

	index = None if rebuild else load_faiss_index(INDEX_PATH, embeddings.shape[1])
	if index is None:
		index = build_faiss_index(embeddings, INDEX_PATH)

	model = SentenceTransformer(MODEL_NAME)
	q_emb = model.encode([query], convert_to_numpy=True)
	faiss.normalize_L2(q_emb)

	top_n = len(rows_back)
	D, I = index.search(q_emb, top_n)

	candidates = []
	for score, idx in zip(D[0], I[0]):
		if idx < 0 or idx >= len(rows_back):
			continue
		if score <= threshold:
			continue
		r = rows_back[idx].copy()
		r["score"] = float(score)
		candidates.append(r)


	candidates.sort(key=lambda x: x["score"], reverse=True)
	if k is not None and k > 0:
		candidates = candidates[:k]
	return candidates


if __name__ == "__main__":
	rebuild = False
	query = "Bone loss in microgravity"
	k = None
	threshold = 0.4
	
	if rebuild:
		if os.path.exists(EMBED_CACHE):
			os.remove(EMBED_CACHE)
		if os.path.exists(INDEX_PATH):
			os.remove(INDEX_PATH)

	res = search(query, k=k, threshold=threshold, rebuild=rebuild)
	for r in res:
		print(f"[{r['id']}] score={r['score']:.4f} hash={r.get('hash')}")
		print(r.get("title"))
		print(r.get("url"))
		print()
	print("Done")