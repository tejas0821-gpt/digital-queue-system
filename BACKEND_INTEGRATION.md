# Backend integration handoff

This frontend is at `outputs/digital-queue-frontend/`. The reserved Python backend location is `outputs/digital-queue-backend/`. It uses plain HTML, CSS, and JavaScript, so the backend team can copy the frontend folder into the Python project as its `frontend/` directory (the brief asks the group to use that folder) or configure the Python server to serve this directory as static files.

## Recommended API contract

Implement these JSON routes, or map the route constants and field normalizers in `app.js` to the endpoint sheet the group already has:

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/api/tokens` | `{ "name": "Ravi", "category": "Account support" }` | `201` with a token object |
| `GET` | `/api/tokens/{id}` | — | `200` with the current token object |
| `POST` | `/api/tokens/{id}/leave` | optional `{}` | `200` with the updated token, or `204` |
| `GET` | `/api/queue` | — | `200` with the active queue |

Token object:

```json
{
  "id": "Q-105",
  "name": "Ravi",
  "category": "Account support",
  "position": 3,
  "status": "waiting",
  "now_serving": "Q-102",
  "estimated_wait": 12
}
```

Use `waiting`, `serving`, `completed`, or `cancelled` for `status`. The queue response can be:

```json
{
  "now_serving": "Q-102",
  "average_wait": 8,
  "queue": [
    { "id": "Q-102", "name": "Asha", "category": "General enquiry", "status": "serving", "position": 0 },
    { "id": "Q-105", "name": "Ravi", "category": "Account support", "status": "waiting", "position": 1 }
  ]
}
```

On failures, return a useful status code and JSON such as `{ "error": "Token not found" }`; the frontend displays that error. The status route should return the latest position each time because the frontend calls it immediately and then every five seconds. Leaving a token should change its status to `cancelled`, and it should no longer appear in the active queue.

## Switch the frontend from demo to backend

In `app.js`, set `API.DEMO_MODE` to `false`. The default route paths above are already configured. Keep `API.BASE_URL` empty when the Python server serves both the pages and API from the same origin. If the API is hosted separately, set `API.BASE_URL` to its public origin, for example `https://queue-api.example.edu` (origin only, no `/api` suffix). `normalizeToken()` and `normalizeQueue()` accept the fields above; adjust them only if the endpoint sheet uses different names.

## Make it available to phones from any network

1. Deploy the frontend and backend to internet-accessible hosting. A public HTTPS address is required; `localhost` points to the phone itself, and private LAN addresses only work on that LAN.
2. Prefer one origin: serve the frontend and `/api/...` through the same public Python app. If separate hosts are used, set `API.BASE_URL` and configure the backend's CORS allowlist to include the frontend's exact public HTTPS origin.
3. Open the deployed `qr.html`. It uses the current public site address by default. Confirm the status message says **Public HTTPS link**, then download and share the QR image.
4. Scan the downloaded QR from a phone with Wi-Fi turned off or on another network to confirm the public URL and API are reachable.

The QR page accepts a custom URL, but editing the QR target does not publish the app. Deployment must happen first. No hosting provider or account is configured in this project, so the backend or hosting team needs to publish it and provide the final URL.
