# Lineup — Digital Queue Frontend

Phone-first frontend for the user pages described in the project brief:

- `index.html` — request a token.
- `status.html?id=TOKEN_ID` — see token status and place, auto-refresh every five seconds, or leave the queue.
- `display.html` — public queue display, auto-refresh every five seconds.
- `qr.html` — create and download the QR code that opens the join page.

## Run the demo

The current local server is available at [http://localhost:8000/](http://localhost:8000/). To run it yourself, open PowerShell in this folder and run `python -m http.server 8000`, then open `http://localhost:8000/`. Demo mode stores its sample queue in this browser's local storage.

## Public HTTPS publishing

This folder is prepared for GitHub Pages: `.github/workflows/deploy.yml` publishes it on each push to `main`. Create a repository containing the contents of this folder at its root, enable **Settings → Pages → GitHub Actions**, then push to `main`. GitHub provides the resulting HTTPS site URL after the workflow completes. On GitHub Free, Pages requires a public repository, which makes the frontend source code visible; private repositories can publish Pages on eligible paid plans. This is a demo deployment until the backend is connected.

## Backend handoff

Give your backend teammate the whole `digital-queue-frontend` folder and [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md). The reserved sibling folder for their Python work is `../digital-queue-backend/`. The simplest setup is to have the Python backend serve these static files and the `/api/...` routes from the same origin. The proposed API payloads and response fields are documented in that handoff. If your group's endpoint sheet already defines different routes or field names, the frontend can be mapped to it in `app.js`.

## Phone access from outside your Wi-Fi

The QR cannot make a private laptop address public. To scan from anywhere, deploy the frontend and backend to internet-accessible hosting and use an HTTPS URL. If the backend serves the frontend, it can stay same-origin. If frontend and API are hosted on different origins, set `API.BASE_URL` in `app.js` to the backend's public HTTPS origin and enable CORS on the backend for the frontend's exact public origin. Open `qr.html` on the deployed site, confirm it says **Public HTTPS link**, then download that QR image. Do not publish `localhost`, `127.0.0.1`, or a `192.168.x.x`/private-network URL.

No build step is needed; this is plain HTML, CSS, and JavaScript. QR code rendering uses the qrcodejs CDN, so the QR page needs internet access.
