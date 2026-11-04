import os
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(title="Portfolio AI Evaluator", version="1.0.0")
origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "*").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False, allow_methods=["POST", "GET"], allow_headers=["*"])

class PortfolioPayload(BaseModel):
    title: str = "Portfolio"
    text: str
    sections: list[dict[str, Any]] = []
    links: list[dict[str, str]] = []
    generatedAt: str | None = None

@app.get("/")
def health():
    return {"status": "ok", "service": "Portfolio AI Evaluator"}

@app.post("/evaluate")
async def evaluate(payload: PortfolioPayload):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured on the server")
    prompt = f"""You are a rigorous but constructive professional portfolio reviewer. Assess only evidence present in the supplied portfolio. Do not invent achievements, skills, project outcomes, or credentials. Score six categories from 0 to 100: Profile & positioning, Project evidence, Skills & learning, Experience & credentials, Trust & accessibility, Freshness & completeness. Overall score is the weighted average using weights 20,25,15,15,15,10 respectively. Return JSON only with keys score (integer), grade (Strong/Good/Developing/Needs work), summary (string), categories (array of objects each with name,score,weight), recommendations (array of up to 8 objects with priority,category,text). Recommendations must be specific, evidence-based, and actionable. Mention missing evidence rather than assuming it does not exist.

PORTFOLIO TITLE: {payload.title}
PORTFOLIO CONTENT:
{payload.text[:16000]}

SECTIONS:
{payload.sections[:30]}

LINKS:
{payload.links[:60]}"""
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + api_key
    body = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}}
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(url, json=body)
    if response.is_error:
        raise HTTPException(status_code=502, detail="The AI provider could not complete the review")
    try:
        raw = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        import json
        result = json.loads(raw)
        if not isinstance(result.get("score"), (int, float)) or not isinstance(result.get("categories"), list) or not isinstance(result.get("recommendations"), list):
            raise ValueError("Invalid model response")
        result["score"] = max(0, min(100, round(result["score"])))
        return result
    except Exception as exc:
        raise HTTPException(status_code=502, detail="The AI provider returned an unreadable assessment") from exc
