# Motive — Sequence Diagrams

**Version:** 1.0

---

# Purpose

This document describes the major user journeys and system interactions within Motive.

These diagrams focus on how information flows through the application rather than implementation details.

The architecture follows:

- User Initiates
- Planner Orchestrates
- Motive AI Reasons
- Google Services Provide Context
- UI Displays Results

---

# Flow 1 — User Login

```mermaid
sequenceDiagram

actor User

participant UI

participant Firebase

participant Planner

participant Firestore

User->>UI: Sign in with Google

UI->>Firebase: Authenticate

Firebase-->>UI: User Profile

UI->>Planner: Initialize Session

Planner->>Firestore: Load User Data

Firestore-->>Planner: Goals + Commitments + Settings

Planner-->>UI: Dashboard Data

UI-->>User: Display Dashboard
```

---

# Flow 2 — Create Goal

```mermaid
sequenceDiagram

actor User

participant UI

participant Planner

participant Firestore

participant MotiveAI

User->>UI: Create Goal

UI->>Planner: Save Goal

Planner->>Firestore: Store Goal

Planner->>MotiveAI: Expand Goal

MotiveAI-->>Planner: Suggested Commitments

Planner->>Firestore: Store Commitments

Planner-->>UI: Refresh Dashboard
```

---

# Flow 3 — Calendar Synchronization

```mermaid
sequenceDiagram

participant GoogleCalendar

participant SyncEngine

participant Planner

participant Firestore

participant MotiveAI

GoogleCalendar->>SyncEngine: Calendar Changes

SyncEngine->>Planner: Normalized Commitments

Planner->>Firestore: Save Changes

Planner->>MotiveAI: Analyze Impact

MotiveAI-->>Planner: Recommendation

Planner-->>SyncEngine: Sync Complete
```

---

# Flow 4 — Gmail Discovery

```mermaid
sequenceDiagram

participant Gmail

participant SyncEngine

participant MotiveAI

participant Planner

participant UI

Gmail->>SyncEngine: New Email

SyncEngine->>MotiveAI: Summarize Email

MotiveAI-->>Planner: Suggested Artifact

Planner-->>UI: Review Queue

User->>UI: Accept

UI->>Planner: Create Relationship
```

---

# Flow 5 — Recommendation Generation

```mermaid
sequenceDiagram

participant Planner

participant Firestore

participant MotiveAI

participant UI

Planner->>Firestore: Load Context

Firestore-->>Planner: Goals + Commitments

Planner->>MotiveAI: Generate Recommendation

MotiveAI-->>Planner: Recommendation JSON

Planner-->>UI: Update Recommendation Card
```

---

# Flow 6 — Complete Commitment

```mermaid
sequenceDiagram

actor User

participant UI

participant Planner

participant Firestore

participant MotiveAI

User->>UI: Mark Complete

UI->>Planner: Update Commitment

Planner->>Firestore: Save Status

Planner->>MotiveAI: Recalculate Plan

MotiveAI-->>Planner: Updated Recommendation

Planner-->>UI: Refresh Dashboard
```

---

# Flow 7 — Focus Block Planning

```mermaid
sequenceDiagram

participant Planner

participant Firestore

participant MotiveAI

participant GoogleCalendar

Planner->>Firestore: Load Calendar

Planner->>MotiveAI: Find Focus Time

MotiveAI-->>Planner: Suggested Blocks

Planner->>GoogleCalendar: Optional Sync

Planner->>Firestore: Store Focus Blocks
```

---

# Flow 8 — Daily Brief

```mermaid
sequenceDiagram

participant Planner

participant Firestore

participant MotiveAI

participant UI

Planner->>Firestore: Collect Today's Context

Planner->>MotiveAI: Generate Daily Brief

MotiveAI-->>Planner: Summary

Planner-->>UI: Render Brief
```

---

# Flow 9 — Recommendation Acceptance

```mermaid
sequenceDiagram

actor User

participant UI

participant Planner

participant Firestore

User->>UI: Accept Recommendation

UI->>Planner: Execute Action

Planner->>Firestore: Update Entities

Planner-->>UI: Refresh Dashboard
```

---

# Flow 10 — End-to-End Overview

```mermaid
flowchart LR

GoogleCalendar --> SyncEngine

Gmail --> SyncEngine

SyncEngine --> Planner

Firestore --> Planner

Planner --> MotiveAI

MotiveAI --> Planner

Planner --> Dashboard

Dashboard --> User
```

---

# Design Principles

Every flow follows the same philosophy.

- Planner owns orchestration.
- Motive AI performs reasoning.
- Firestore stores data.
- Google remains the source of truth.
- UI never communicates directly with external services.

---

# Guiding Principle

Every user interaction should follow:

Input

↓

Planner

↓

Reasoning

↓

Persistence

↓

UI Update

This keeps the architecture predictable, testable, and scalable.