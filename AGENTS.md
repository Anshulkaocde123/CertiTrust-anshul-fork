Project Context: DPI-3 Document Verification & Trust Layer
🎯 Project Goals
Build a Digital Public Infrastructure (DPI) trust layer that verifies documents using cryptographic signatures and visual forensics. The "Winning USP" is multi-modal tamper detection.

🏗️ Architecture (Monorepo)
Frontend: Root directory (/app, /components). Built with Next.js 15 (App Router).

Backend: /backend directory. Built with FastAPI (Python 3.10+).

Interaction: Frontend will POST document images to the backend at /verify/forensics.

🛠️ Tech Stack & Commands
Frontend Engine: Bun (Package Manager/Runtime).

Install: bun install

Build: bun run build

Forensic Engine: Python 3.10+ using uv or pip.

Core Libs: fastapi, opencv-python-headless, pillow, numpy.

Infrastructure: Supabase (Auth & PostgreSQL audit logs).

📜 Conventions & Rules
TypeScript: Use strict typing. Prefer React Server Components (RSC).

Python: Follow PEP8. Use async def for FastAPI routes.

Forensics: All image processing must happen in the /backend microservice.

Security: Never commit .env files. Use SHA-256 for document hashing.

🧪 Testing & Validation
Frontend: bun test

Backend: pytest

Why this is critical for your win:
Context Awareness: Jules reads this file to understand that a frontend already exists and that its task is to build a separate backend service in the /backend folder.

Environment Optimization: By specifying Bun, Jules will use the fastest possible dependency installation during its cloud VM setup.

Consistency: It prevents the AI from choosing random libraries; it forces Jules to use opencv-python-headless, which is required for forensic heatmaps in cloud environments.