# Motive — Firestore Data Model

**Version:** 1.0

**Status:** Draft

---

# Purpose

This document defines the persistence layer of Motive.

The goal is to design a Firestore model that is:

* scalable
* AI-friendly
* query efficient
* inexpensive
* extensible

Firestore should store normalized business data.

Business logic belongs to the Execution Engine.

AI reasoning belongs to Motive AI.

---

# Design Principles

Firestore is not the domain model.

Firestore is persistence.

Avoid deeply nested documents.

Prefer flat collections.

Avoid excessive reads.

Denormalize when beneficial.

---

# Collections

```text
users/

goals/

commitments/

relationships/

recommendations/

timeline/

artifacts/

knowledge/

settings/

sync/
```

---

# users

Represents authenticated users.

Document ID

```
userId
```

Example

```json
{
  "name": "Partha",
  "email": "...",
  "photoUrl": "...",
  "timezone": "Asia/Kolkata",
  "createdAt": "...",
  "lastLogin": "..."
}
```

---

# goals

Document ID

```
goalId
```

Example

```json
{
  "title": "France Visa",
  "description": "...",
  "deadline": "...",
  "momentum": 78,
  "risk": "MEDIUM",
  "status": "ACTIVE",
  "area": "Travel",
  "createdBy": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# commitments

Everything consuming time.

Document ID

```
commitmentId
```

Example

```json
{
  "type": "EVENT",
  "title": "Passport Scan",
  "constraint": "FLEXIBLE",
  "origin": "USER",
  "status": "PLANNED",
  "startTime": "...",
  "endTime": "...",
  "estimatedDuration": 30,
  "calendarId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

# relationships

Connects Goals and Commitments.

Document ID

Auto Generated

Example

```json
{
  "goalId": "...",
  "commitmentId": "...",
  "confidence": 0.92,
  "source": "AI",
  "reason": "Interview belongs to Career Goal"
}
```

---

# recommendations

Stores current AI recommendations.

Example

```json
{
  "title": "Upload Passport Copy",
  "reason": "...",
  "impact": 12,
  "confidence": 94,
  "estimatedMinutes": 20,
  "goalId": "...",
  "status": "ACTIVE"
}
```

Only active recommendations should remain here.

History belongs in Timeline.

---

# timeline

Immutable history.

Example

```json
{
  "type": "COMMITMENT_COMPLETED",
  "entityId": "...",
  "summary": "...",
  "createdAt": "..."
}
```

Timeline is append-only.

Never update timeline entries.

---

# artifacts

Represents external information.

Examples

Calendar Events

Emails

Future Slack Messages

Example

```json
{
  "type": "EMAIL",
  "source": "GMAIL",
  "title": "...",
  "summary": "...",
  "receivedAt": "...",
  "link": "..."
}
```

Do not store entire email bodies.

---

# knowledge

Stores AI understanding.

Example

```json
{
  "type": "PATTERN",
  "summary": "User prefers evenings.",
  "confidence": 0.81,
  "createdAt": "..."
}
```

Knowledge is optional.

Disabled for MVP.

---

# settings

User preferences.

```json
{
  "theme": "SYSTEM",
  "calendarSync": true,
  "gmailSync": false,
  "focusBlockSync": true,
  "notifications": true
}
```

---

# sync

Tracks synchronization state.

Example

```json
{
  "calendarSyncToken": "...",
  "gmailHistoryId": "...",
  "lastCalendarSync": "...",
  "lastGmailSync": "..."
}
```

This avoids importing everything repeatedly.

---

# Relationships

```text
Goal

↓

Relationship

↓

Commitment

↓

Recommendation

↓

Timeline
```

Artifacts may create Relationships.

Knowledge influences Recommendations.

---

# Query Strategy

Dashboard

↓

Goals

↓

Current Recommendations

↓

Upcoming Commitments

↓

Timeline

Avoid loading everything.

Use pagination where appropriate.

---

# Indexing

Create composite indexes for:

Goal + Status

Commitment + Start Time

Commitment + Status

Recommendation + Status

Timeline + CreatedAt

---

# IDs

Prefer Firestore generated IDs.

Never encode business meaning inside IDs.

---

# Soft Deletes

Avoid hard deletes.

Use

```
status = ARCHIVED
```

when appropriate.

Timeline should remain immutable.

---

# Caching

Cache:

Goals

Settings

Recommendations

Do not cache synchronization tokens indefinitely.

---

# Security Rules

Users may only access:

Their own Goals

Their own Commitments

Their own Recommendations

Their own Settings

Reject cross-user access.

---

# Future Collections

Future versions may introduce

Areas

Habits

Projects

Teams

Documents

without affecting the current model.

---

# Design Goal

Firestore should remain simple.

Complexity belongs in the Execution Engine rather than the database.
