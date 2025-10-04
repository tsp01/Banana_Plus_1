import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

def query_faiss(docs, query):

    model = SentenceTransformer("intfloat/e5-small-v2")

    doc_embeddings = model.encode(docs, normalize_embeddings=True)
    dim = doc_embeddings.shape[1]

    index = faiss.IndexFlatIP(dim) 
    index.add(doc_embeddings)       

    query = "bone loss in microgravity"
    query_emb = model.encode([query], normalize_embeddings=True)

    k = 12
    sim_scores, Idxes = index.search(query_emb, k)  


    for rank, (score, idx) in enumerate(zip(D[0], I[0]), start=1):
        print(f"{rank}. {docs[idx]} (score={score:.3f})")

if __name__ == '__main__':
    