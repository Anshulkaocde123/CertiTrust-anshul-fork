#!/usr/bin/env python3
"""
Document Issuance Script for CertiTrust
Usage: python issue_document.py <input_pdf_path> [output_pdf_path]
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

# Set environment variables (you can also set these externally)
os.environ['ISSUER_PRIVATE_KEY'] = os.environ.get('ISSUER_PRIVATE_KEY', 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1DNENBUUF3QlFZREsyVndCQ0lFSU9scUVkK0dCMHIzTjBuZi9hWUNYMFhhZjJVL29UUnRrRkR0RjNvbUlCWU0KLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQ==')
os.environ['SUPABASE_URL'] = os.environ.get('SUPABASE_URL', 'https://jruxbqdfcdyemwpihmxx.supabase.co')
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpydXhicWRmY2R5ZW13cGlobXh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg0MzY3OSwiZXhwIjoyMDg1NDE5Njc5fQ.L25zeZDibbQsuMDAVmCxk_HIcC17gA-VuCItSXaLFfA')

from fastapi.testclient import TestClient
from main import app

def issue_document(input_path: str, output_path: str = None):
    """
    Issue a document by processing it through the CertiTrust pipeline.

    Args:
        input_path: Path to the input PDF file
        output_path: Path to save the stamped PDF (optional)
    """
    if not os.path.exists(input_path):
        print(f"❌ Error: Input file '{input_path}' not found")
        return False

    if not input_path.lower().endswith('.pdf'):
        print("❌ Error: Only PDF files are supported")
        return False

    if output_path is None:
        # Generate output path
        input_name = Path(input_path).stem
        output_path = f"{input_name}_stamped.pdf"

    print(f"📄 Processing document: {input_path}")
    print("🔐 Loading issuer private key...")
    print("📊 Calculating document hash...")
    print("✍️  Generating digital signature...")
    print("📱 Creating QR code...")
    print("🏷️  Stamping document...")
    print("📝 Logging to audit trail...")
    client = TestClient(app)

    try:
        with open(input_path, "rb") as f:
            response = client.post(
                "/issue/document",
                files={"file": (os.path.basename(input_path), f, "application/pdf")}
            )

        if response.status_code != 200:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False

        # Save the stamped document
        with open(output_path, "wb") as f:
            f.write(response.content)

        print("✅ Document issued successfully!")
        print(f"📁 Stamped document saved to: {output_path}")
        print("🔍 The document now contains:")
        print("   • Cryptographic hash for integrity verification")
        print("   • Digital signature from institutional key")
        print("   • QR code with verification data")
        print("   • Audit trail entry in Supabase")
        return True

    except Exception as e:
        print(f"❌ Error processing document: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python issue_document.py <input_pdf_path> [output_pdf_path]")
        print("\nExample:")
        print("  python issue_document.py my_document.pdf")
        print("  python issue_document.py input.pdf stamped_output.pdf")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    success = issue_document(input_path, output_path)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()