from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from sim_search import search
# from summary import time_summary

app = FastAPI()

#uncomment for local 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    searchQuery: str
    k: Optional[int] = None
    threshold: Optional[float] = 0.5

class SummaryRequest(BaseModel):
    title_list: List[str]

@app.post("/search", response_model=List[str])
def do_search(req: SearchRequest):
    results = search(req.searchQuery, k=req.k, threshold=req.threshold)
    titles = [r.get("title") for r in results]
    if not titles:
        return ["No results found."]
    return titles

# @app.post("/summary")
# def get_summary(req: SummaryRequest):
#     result = time_summary(req.titles)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8453)
