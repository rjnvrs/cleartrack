# Architecture and safeguards

The demo uses a modular monolith shape: the HTTP adapter, authorization policy, workflow transitions, playbook runner, and audit writer are colocated in `server.mjs` so the same rules govern UI and API calls. A production split can move these modules into `apps/api`, `packages/domain`, and `packages/playbooks` without changing the contracts.

## Domain rules

- `Overdue` is calculated from `dueAt` while an issue is not `Closed`.
- A transition must match the issue's current version and allowed next-state list.
- A closure submitted by an owner cannot be approved by that same user.
- AI analysis creates recommendations and approval-required actions; it cannot close issues or approve its own actions.
- Evidence references are stored as metadata and are never fetched automatically.
- Every successful mutation writes an append-only audit event in the same application operation.

## Production adapters

Replace the in-memory maps with PostgreSQL and Prisma, use secure HTTP-only sessions plus CSRF protection, store uploaded files in a private/quarantined volume, add MIME/size validation and virus scanning, and expose the narrow MCP tools from the specification through the same domain service functions. Keep issue descriptions and evidence untrusted: they must never redefine the action allowlist or authorization policy.
