# Backend integration handoff

The frontend demo is live at [https://tejas0821-gpt.github.io/digital-queue-system/](https://tejas0821-gpt.github.io/digital-queue-system/). This public repository contains the frontend only. The separate local placeholder for the team's Python backend is outputs/digital-queue-backend/.

The live pages currently use browser-local demo data. Each phone gets its own sample queue; a shared queue will work after the backend is built and connected.

## Suggested API contract

| Method | Route | Request | Response |
| --- | --- | --- | --- |
| POST | /api/tokens | name, category | token object |
| GET | /api/tokens/{id} | none | current token object |
| POST | /api/tokens/{id}/leave | optional empty JSON | updated token or 204 |
| GET | /api/queue | none | queue object |

A token object should include id, name, category, position, status, now_serving, and estimated_wait. Use waiting, serving, completed, or cancelled for status. The queue response should include now_serving, average_wait, and an array named queue. For errors, return a useful HTTP status and JSON with an error field. Leaving the queue should set the token status to cancelled and remove it from the active queue.

The frontend sends { name, category } when creating a token and refreshes a token's status every five seconds. The field mappings and paths are in app.js.

## Connect the backend

1. Serve the frontend pages and the /api routes from the same Python app when possible.
2. In app.js, set API.DEMO_MODE to false. Keep API.BASE_URL empty for a same-origin setup; for a separate API host, set it to the backend's public HTTPS origin and allow the frontend origin in the backend's CORS settings.
3. Update the frontend's GitHub Pages deployment when app.js changes. The deploy workflow is in .github/workflows/deploy.yml.
4. After the API is publicly deployed, use the QR page on the public frontend URL and check that it identifies the address as a Public HTTPS link.

No secrets belong in frontend JavaScript. Keep backend credentials in the hosting provider's environment variables.
