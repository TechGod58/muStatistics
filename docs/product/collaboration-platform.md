# Collaboration Platform Expansion

## Why this matters

muStatistics is growing beyond a single-user research tool.

The university workflow now needs:

- support for up to 100 concurrent connections during pilot use
- a clear distinction between solo workspaces and collaborative workspaces
- team creation and email-based invitations
- in-app team chat
- instructor oversight that can cross normal project boundaries

These requirements are useful, but they also introduce security, privacy, delivery, and performance concerns that are separate from SPSS/NVivo-style analysis features.

## Scope split

### Safe to implement immediately

- project workspace mode: `solo` or `collaborative`
- team and invitation data model
- email delivery abstraction for invites
- chat message persistence
- audit events for membership and chat actions
- performance testing for 100 active connections

### Requires policy approval before implementation

- instructor or professor access to projects they were not invited to

That rule affects FERPA-sensitive data, student privacy, audit expectations, and how the system should explain access to users.

## Recommended platform model

### Workspace modes

- `solo`
  - private by default
  - only the owner and approved institutional overrides can access it
- `collaborative`
  - owned by one or more users
  - supports project membership, invitations, chat, and shared editing

### Team model

- teams should be first-class entities, separate from projects
- a team can own multiple projects
- students can create a team and invite other students or staff by email
- invited users should accept the invite before gaining access

### Invitation model

- store invitation records with email, inviter, target team, role, token, status, and expiration
- send a signed invite link by email
- allow resend, revoke, and expiry handling
- use SMTP credentials from environment configuration

### Chat model

- chat should start with project-scoped room messaging
- persist messages to the database for auditability and page reload recovery
- use a lightweight real-time transport for delivery
- if real-time delivery is temporarily unavailable, polling can be the fallback

### Performance target

- the first collaboration target should be 100 concurrent connected clients
- that target should be validated with connection and broadcast load tests, not assumed
- for this scale, a single-node Fastify deployment can be sufficient if payloads stay small and database access is indexed

## Recommended delivery phases

### Phase C1: Collaboration foundation

- add project workspace mode
- add teams, invitations, and audit tables
- add SMTP configuration shape
- define instructor override policy

### Phase C2: Invitations and membership

- create team CRUD
- invite by email
- accept/reject invite flow
- team-to-project membership mapping

### Phase C3: Chat

- project chat room
- unread indicators
- popup chat window in the web UI
- persisted message history

### Phase C4: Scale validation

- load-test 100 concurrent connections
- tune polling or websocket behavior
- measure database contention and API latency

## Immediate engineering recommendation

Build the collaboration foundation before implementing live chat.

The next practical order is:

1. workspace mode
2. team and invitation model
3. SMTP invite delivery
4. professor-access policy
5. project chat
6. concurrency testing
