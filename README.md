# Lineup — Digital Queue Frontend

Phone-first frontend for the user pages described in the project brief:

- `index.html` — request a token.
- `status.html?id=TOKEN_ID` — see token status and place, auto-refresh every five seconds, or leave the queue.
- `display.html` — public queue display, auto-refresh every five seconds.
- `qr.html` — create and download the QR code that opens the join page.

## Run the demo locally

Open this repository's GitHub Pages site at https://tejas0821-gpt.github.io/digital-queue-system/. To run from a local copy, open PowerShell in the frontend folder and run `python -m http.server 8000`, then open `http://localhost:8000/`. Demo mode stores sample tokens in each browser's local storage.

## Public HTTPS site

The frontend demo is published at [https://tejas0821-gpt.github.io/digital-queue-system/](https://tejas0821-gpt.github.io/digital-queue-system/). The source repository is [tejas0821-gpt/digital-queue-system](https://github.com/tejas0821-gpt/digital-queue-system). The workflow at `.github/workflows/deploy.yml` redeploys the site when changes are pushed to `main`.

This is still demo mode: each visitor's browser has its own sample queue in local storage, so different phones do not share token state until the backend is built and connected. The GitHub repository is public, so the frontend source is public too.

## Backend handoff

See [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) for the API contract and connection instructions. The Python backend placeholder is reserved locally at `outputs/digital-queue-backend/`; it is not included in this frontend-only repository.
