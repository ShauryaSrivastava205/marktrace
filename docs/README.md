# MarkTrace

MarkTrace is a diagnostic learning tool. It runs students through a short DSA
diagnostic, maps conceptual mistakes back to root gaps in a concept graph, and
shows which dependent topics and marks are affected.

## What works today

- POST /diagnose runs the six-stage root-cause engine on a student's answers.
- POST /verify/probe returns a matching three-signal probe for a supported
  root-gap pair (currently Recursion to Dynamic Programming and Graphs to BFS).
- POST /verify/grade grades that exact probe without exposing answer keys.
- GET /health is a deployment liveness check.

The frontend currently has the quiz and results experience. Its final task is
to call these real endpoints rather than its temporary mock data.

## Repo layout

~~~
frontend/   Next.js (TypeScript) student UI
backend/    FastAPI diagnostic and verification API
data/       DSA concept graph, question bank, and verification probes
docs/       API contract and contribution workflow
~~~

## Run locally

### Backend

~~~bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
~~~

The API allows http://localhost:3000 by default. For a deployed frontend, set
MARKTRACE_CORS_ORIGINS to a comma-separated list of trusted origins:

~~~bash
export MARKTRACE_CORS_ORIGINS="http://localhost:3000,https://your-app.vercel.app"
~~~

Run backend checks:

~~~bash
cd backend
python -m unittest discover -s tests
~~~

### Frontend

~~~bash
cd frontend
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
~~~

## MVP scope

The submission MVP is a guest student flow: quiz to diagnosis to personalised
study plan to optional verification. Authentication, class analytics, and
long-term progress tracking are post-MVP work.
