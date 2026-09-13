# MarkTrace

MarkTrace is a diagnostic learning tool. It runs students through a short
diagnostic, maps wrong answers back to root concept gaps in a subject's
concept graph, and reports which gaps are putting the most marks at risk
downstream — rather than just marking individual questions right or wrong.

## Repo layout

```
frontend/   Next.js (TypeScript) app — student/teacher UI
backend/    FastAPI app — diagnostic API
data/       Concept graphs and question banks (content, not code)
docs/       Project docs (this file, API contract, git workflow)
```

The backend currently only exposes `GET /health`. The frontend's `/dashboard`
page calls it and shows the result, to confirm the two sides can talk. See
[API_CONTRACT.md](./API_CONTRACT.md) for the target API shape as real
endpoints get built.

## Running the backend

```bash
cd backend
python3 -m venv venv          # first time only
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/health` → `{"status":"ok"}`

## Running the frontend

The frontend uses pnpm (pinned via `packageManager` in `frontend/package.json`).

```bash
cd frontend
corepack enable                # first time only, if pnpm isn't installed
pnpm install
cp .env.example .env.local     # sets NEXT_PUBLIC_API_URL=http://localhost:8000
pnpm dev
```

Open http://localhost:3000/dashboard (or log in from http://localhost:3000) —
the backend status line at the bottom of the dashboard confirms the fetch to
`/health` succeeded. Run the backend first (or alongside it) so the fetch
succeeds.

## Contributing

See [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) for branching and PR conventions.
