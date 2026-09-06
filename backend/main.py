"""
FastAPI Microservice for OIL SIF Intelligence Engine
Exposes endpoints for file uploads (PDF, DOCX, TXT), text extraction,
DeBERTa-v3 model inference, and semantic clustering.
"""

import os
import json
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from nlp_engine import SIFNlpEngine

app = FastAPI(
    title="OIL SIF Intelligence NLP Backend",
    description="Enterprise HSE NLP Engine for SIH26165 (Oil India Limited)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SIFNlpEngine()

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "database.json")

def load_db() -> Dict[str, Any]:
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"reports": [], "patterns": [], "alerts": [], "feedback": [], "is_demo_mode": False}

def save_db(data: Dict[str, Any]):
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def extract_text_from_upload(content: bytes, filename: str) -> str:
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext == "txt":
        try:
            text = content.decode("utf-8").strip()
            if not text:
                raise HTTPException(status_code=422, detail="The uploaded text file is empty.")
            return text
        except UnicodeDecodeError:
            try:
                return content.decode("latin-1").strip()
            except Exception:
                raise HTTPException(status_code=422, detail="Unable to extract readable text from this file.")

    elif ext == "docx":
        try:
            import docx
            import io
            doc = docx.Document(io.BytesIO(content))
            full_text = [para.text for para in doc.paragraphs if para.text.strip()]
            text = "\n".join(full_text).strip()
            if not text:
                raise HTTPException(status_code=422, detail="The uploaded DOCX document contains no readable text.")
            return text
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"DOCX extraction failed: {str(e)}")

    elif ext == "pdf":
        try:
            import pypdf
            import io
            reader = pypdf.PdfReader(io.BytesIO(content))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            text = text.strip()
            if not text or len(text) < 15:
                # Scanned image PDF detection
                raise HTTPException(
                    status_code=422,
                    detail="Text could not be extracted from this document. OCR is required for scanned reports."
                )
            return text
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=422,
                detail="Text could not be extracted from this document. OCR is required for scanned reports."
            )

    raise HTTPException(status_code=400, detail=f"Unsupported file format (.{ext}). Supported types: PDF, DOCX, TXT.")


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "OIL SIF Intelligence NLP Backend",
        "pipeline": "FastAPI -> Text Extraction -> DeBERTa-v3 NLP -> Database",
        "organization": "Oil India Limited SIH 2026 Solution"
    }

@app.post("/api/reports/upload")
async def upload_report(
    file: Optional[UploadFile] = File(None),
    report_text: Optional[str] = Form(None),
    report_type: str = Form("Near Miss"),
    site: str = Form("Moran Central Tank Farm"),
    date: str = Form(None),
    activity: Optional[str] = Form(None)
):
    """
    Accepts multipart/form-data with file or pasted text, extracts text,
    runs NLP SIF analysis, and saves to database.
    """
    extracted_text = ""
    if file and file.filename:
        content = await file.read()
        extracted_text = extract_text_from_upload(content, file.filename)
    elif report_text and report_text.strip():
        extracted_text = report_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please provide a file or report text narrative.")

    if len(extracted_text) < 10:
        raise HTTPException(status_code=400, detail="Report narrative is too brief for safety analysis.")

    # Execute NLP Engine
    analysis = engine.analyze_free_text(
        report_text=extracted_text,
        report_type=report_type,
        site=site
    )

    # Save to Database
    db = load_db()
    new_report = {
        "id": analysis["report_id"],
        "report_text": extracted_text,
        "report_type": report_type,
        "site": site,
        "date": date or "2026-09-04",
        "activity": analysis["activity"],
        "location": analysis["location"],
        "hazard": analysis["hazard"],
        "barrier_failure": analysis["barrier_failure"],
        "sif_potential": analysis["sif_potential"],
        "sif_score": analysis["sif_score"],
        "life_saving_rule": analysis["life_saving_rule"],
        "sif_precursor": analysis["sif_precursor"],
        "explanation": analysis["explanation"],
        "evidence": analysis["evidence"],
        "recommended_actions": analysis["recommended_actions"],
        "review_status": "Pending Review",
        "is_demo": False
    }

    db["reports"].insert(0, new_report)
    save_db(db)

    return {
        "report_id": analysis["report_id"],
        "status": "completed",
        "report": new_report,
        "analysis": analysis
    }

@app.get("/api/reports")
def get_reports(q: Optional[str] = None, site: Optional[str] = None, sif: Optional[str] = None):
    db = load_db()
    reports = db.get("reports", [])
    if q:
        q_lower = q.lower()
        reports = [r for r in reports if q_lower in r.get("report_text", "").lower() or q_lower in r.get("id", "").lower()]
    if site:
        reports = [r for r in reports if site.lower() in r.get("site", "").lower()]
    if sif:
        reports = [r for r in reports if sif.lower() == r.get("sif_potential", "").lower()]
    return {"total": len(reports), "reports": reports}

@app.get("/api/reports/{report_id}")
def get_report_by_id(report_id: str):
    db = load_db()
    for r in db.get("reports", []):
        if r.get("id") == report_id:
            return r
    raise HTTPException(status_code=404, detail="Report not found in database")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
