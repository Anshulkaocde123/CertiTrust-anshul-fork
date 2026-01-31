from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uuid

from detector import analyze_image

app = FastAPI(title="CertiTrust Verification API")

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -------------------------------
# STEP 1: QR VERIFICATION (STUB)
# -------------------------------
def verify_qr_code(file_path: str) -> bool:
    # NOT IMPLEMENTED YET
    return True


# -------------------------------
# MAIN ENDPOINT
# -------------------------------
@app.post("/verify-document")
async def verify_document(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # ---- STEP 1: QR CHECK ----
        if not verify_qr_code(file_path):
            return {
                "status": "rejected",
                "reason": "invalid_qr_code"
            }

        # ---- STEP 2: AI CHECK ----
        ai_result = analyze_image(file_path)

        return {
            "status": "verified",
            "qr_verified": True,
            "ai_analysis": ai_result
        }

    finally:
        # ---- Cleanup ----
        if os.path.exists(file_path):
            os.remove(file_path)