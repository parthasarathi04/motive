# Motive — Domain Model

**Version:** 1.0

**Status:** Draft

---

# 1. Purpose

The domain model defines the business language of Motive.

Rather than modeling database tables, it models real-world concepts.

Every entity should represent something meaningful in a user's life.

Avoid creating entities purely for implementation convenience.

---

# 2. Domain Philosophy

Motive understands life through three independent domains.

```text
                    User

                     │

      ┌──────────────┼──────────────┐

      │              │              │

    Goals      Commitments     Knowledge

 Desired       Time            AI Understanding
 Outcomes      Occupancy
```

Each domain has a distinct responsibility.

---

# 3. Goal

## Purpose

Represents a long-term desired outcome.

Examples

* France Visa
* Crack Interview
* Buy a House
* Learn Kotlin
* Build Startup

Goals answer:

> **Where am I trying to go?**

---

## Responsibilities

A Goal owns:

* title
* description
* deadline
* progress
* momentum
* risk
* success metrics

---

## Does NOT own

Scheduling

Calendar Events

Notifications

Meetings

---

## Lifecycle

Draft

↓

Planning

↓

Active

↓

Blocked

↓

Completed

↓

Archived

---

## Example

```text
Goal

France Visa

Deadline

July 15

Momentum

78%

Risk

Medium
```

---

# 4. Commitment

## Purpose

Represents anything that occupies time.

Examples

Meeting

Interview

Workout

Passport Scan

Doctor Appointment

Focus Block

Team Standup

Commitments answer:

> **Where is my time going?**

---

## Categories

Event

Task

Appointment

Focus Block

Habit (Future)

---

## Constraint

Each Commitment has one scheduling constraint.

FIXED

Cannot move.

Examples

Interview

Flight

Visa Appointment

---

FLEXIBLE

Can be rescheduled.

Examples

Workout

Study Session

Coding

---

OPTIONAL

May be skipped.

Examples

Read Blog

Watch Tutorial

---

## Lifecycle

Discovered

↓

Planned

↓

Scheduled

↓

In Progress

↓

Completed

or

Cancelled

---

# 5. Relationship

## Purpose

Connects Goals and Commitments.

Relationships explain WHY a Commitment exists.

---

Examples

Interview

↓

Career Goal

---

Passport Scan

↓

France Visa

---

One Commitment

may relate to

multiple Goals.

One Goal

may contain

multiple Commitments.

---

## Ownership

Relationships may be

User Created

AI Suggested

Imported

---

## Confidence

Every AI-created relationship includes

Confidence

Reason

Source

---

# 6. Focus Block

## Purpose

Represents reserved execution time.

Unlike traditional calendar events,

Focus Blocks do not permanently represent one task.

Instead,

Motive dynamically assigns the most valuable Commitment.

---

Example

```text
Today

7 PM

Focus Block

Travel Goal

↓

AI chooses

Passport Scan
```

Tomorrow

Same Focus Block

↓

AI chooses

Travel Insurance

No calendar modification required.

---

# 7. Recommendation

## Purpose

Represents the current highest-impact action.

Recommendations are generated continuously.

---

Each Recommendation contains

Title

Reason

Expected Impact

Estimated Duration

Confidence

Priority

Primary Action

---

Example

```text
Upload Passport Copy

Why?

Blocks Visa Appointment

Impact

+12 Momentum

Confidence

94%
```

---

# 8. Timeline

## Purpose

Provides explainability.

Every meaningful event becomes part of the Timeline.

Examples

Goal Created

Calendar Imported

Interview Detected

Recommendation Accepted

Commitment Completed

Momentum Increased

Relationship Added

Timeline answers

> **How did we reach this recommendation?**

---

# 9. Knowledge

## Purpose

Represents what Motive AI has learned.

Examples

User prefers evenings.

User postpones workouts.

Interview belongs to Career Goal.

Friday is usually free.

Knowledge improves future recommendations.

Knowledge never replaces user intent.

---

# 10. External Artifact

Represents imported information.

Examples

Calendar Event

Gmail Message

Future

Slack Message

GitHub PR

Jira Ticket

External Artifacts preserve their original source.

---

# 11. Domain Relationships

```text
Goal

↓

Relationship

↓

Commitment

↓

Timeline

↓

Recommendation

↓

Dashboard
```

Knowledge influences every layer.

---

# 12. Ownership

Goal

Owned by User

---

Commitment

Owned by User

or

Google Calendar

or

Motive

---

Relationship

Owned by User

or

Motive AI

---

Recommendation

Owned by Motive AI

---

Timeline

Owned by System

---

Knowledge

Owned by Motive AI

---

# 13. Synchronization Philosophy

Google Calendar

↓

Commitment

Google Gmail

↓

Artifact

Neither source directly creates Goals.

Instead,

Relationships are suggested.

The user remains in control.

---

# 14. Design Principles

Goals define purpose.

Commitments define time.

Relationships define meaning.

Knowledge defines intelligence.

Recommendations define action.

Timeline defines trust.

---

# 15. Guiding Question

Every new entity should answer:

> **Does this represent a real concept in a user's life?**

If not,

it probably should not exist.

---

# 16. Future Extensions

This model intentionally supports:

Habits

Projects

Teams

Slack

GitHub

Jira

Fitness Devices

Wearables

Documents

without changing the core architecture.

---

# 17. Summary

Motive models life through:

Goals

↓

Commitments

↓

Relationships

↓

Knowledge

↓

Recommendations

instead of

Projects

↓

Tasks

↓

Subtasks

↓

Checklists

This creates a flexible, AI-first domain model that can evolve naturally as the product grows.
