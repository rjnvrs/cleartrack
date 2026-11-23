# ClearTrack system flow

ClearTrack follows one controlled path: **Track -> Remediate -> Review -> Close**. The browser views call the same HTTP API used by the MCP adapter, so permission checks and workflow rules are applied in one place.

## 1. Sign in and session setup

The browser stores the selected demo email in `localStorage`, calls `POST /api/v1/auth/demo-login`, and receives an HTTP-only session cookie. Every later API request includes that cookie. `GET /api/v1/me` returns the active user and permissions so the sidebar and controls can reflect the role.

Demo roles are Maria Santos (issue owner), Daniel Kim (compliance reviewer), Avery Chen (administrator), and Jordan Lee (viewer).

## 2. Dashboard

The Dashboard calls `GET /api/v1/dashboard` for live counts, owner queue, recent audit activity, evidence readiness, and proposed AI action counts. It also calls `GET /api/v1/issues` to populate the attention table and severity bars.

Users can search and filter issues, open an issue, refresh the data, open the approval queue, or create a new issue. The dashboard never closes an issue directly.

## 3. Create issue

The Create Issue dialog loads active assignees from `GET /api/v1/assignees`. The form sends title, description, severity, owner, due date, acceptance criteria, and optional compliance reference to `POST /api/v1/issues`.

The server validates required fields, owner activity, severity, and date format, creates version 1 of the issue, and appends an `ISSUE_CREATED` audit event.

## 4. Issues page

The Issues page loads `GET /api/v1/issues` and provides client-side search and filters for severity, status, owner, and overdue work. Selecting a row opens `#issues/<issueKey>`. Refresh reloads the live list from the API.

## 5. Issue details

Issue Details loads the issue, evidence, comments, and audit history from `GET /api/v1/issues/:issueKey`. Active owners are loaded from `/api/v1/assignees`.

The page supports:

- Editing owner, severity, due date, and compliance reference with optimistic version checks through `PATCH /api/v1/issues/:issueKey`.
- Adding evidence references through `POST /api/v1/issues/:issueKey/evidence-references`.
- Uploading file metadata to quarantine through `POST /api/v1/issues/:issueKey/evidence`.
- Running the demo scan through `POST /api/v1/evidence/:id/scan`.
- Downloading verified evidence metadata through `GET /api/v1/evidence/:id/download`.
- Adding comments through `POST /api/v1/issues/:issueKey/comments`.
- Running deterministic AI analysis through `POST /api/v1/issues/:issueKey/playbook-runs`.
- Reviewing and executing only permitted playbook actions.
- Requesting independent approval once evidence is present and scan-ready.

The server rejects review requests without evidence and rejects direct closure transitions.

## 6. AI remediation

AI analysis creates a recorded playbook run with recommended steps and typed actions. Low-risk actions can be executed by an authorized issue user. Approval-required actions cannot be executed by an owner without reviewer permission, and AI cannot approve or close its own work.

## 7. Approval queue

The Approvals page calls `GET /api/v1/approvals`. Issue owners see their own pending requests; reviewers and administrators see the review queue. A reviewer must check evidence, acceptance criteria, and independent reviewer confirmation before approving.

`POST /api/v1/approvals/:id/decision` either closes the issue after approval or returns it to **In progress** after a rejection with a required comment. Both decisions append audit events.

Approval requests are single-use and version-bound. A second decision, an expired request, or a request created against an issue version that has since changed is rejected and requires a fresh review request.

## 8. Audit log

The Audit page loads `GET /api/v1/audit`, supports event search and filtering, and exports the visible audit data as CSV. Issue detail pages show the same history scoped to one issue.

## 9. Settings and account switching

Settings switches demo accounts through the same login endpoint and reloads permissions. The account switcher changes the active session and updates the sidebar identity. The API remains the authority for permissions; the UI only reflects them.

Workspace preferences load from `GET /api/v1/settings`. Administrators can save the timezone, notification preference, and approval expiry window with `PATCH /api/v1/settings`; every update is recorded as `SETTINGS_UPDATED` in the audit log. Non-administrators can view the current values but receive a permission error when saving.

## 10. Persistence and production boundary

The demo persists mutations to `data/cleartrack-state.json`. Production deployment should replace the maps and JSON file with PostgreSQL, durable identity, private evidence storage, CSRF protection, and a real malware scanner while retaining these API contracts and domain rules.
