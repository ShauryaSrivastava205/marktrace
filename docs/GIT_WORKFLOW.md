# Git Workflow

## Branching

- `main` is always deployable. Nobody commits to `main` directly.
- Each person works on their own branch, prefixed with their name:
  `<name>/<short-description>`, e.g. `shaurya/diagnostic-engine`,
  `alex/concept-graph-ui`.
- Keep branches short-lived and focused on one piece of work.

## Making changes

1. Branch off the latest `main`.
2. Commit as you go with clear, descriptive messages.
3. Push your branch and open a pull request into `main`.
4. Fill in what changed and how you tested it (screenshots for UI changes,
   example requests/responses for API changes).

## Pull requests

- At least one other person reviews and approves before merging.
- Resolve conversations before merging, don't dismiss them.
- Squash or rebase-merge to keep `main`'s history readable — avoid merge
  commits piling up.
- Delete the branch after it's merged.

## Keeping in sync

- Rebase (or merge `main` into) your branch regularly to avoid large,
  painful conflicts later.
- If `docs/API_CONTRACT.md` changes, call it out explicitly in your PR
  description so the other side (frontend/backend) can adjust.
