# Motive — AI Architecture

**Version:** 1.0

---

# Purpose

Motive AI is responsible for understanding, reasoning and explaining.

It is **not** responsible for deterministic business rules.

The AI should behave like a trusted Chief of Staff.

It continuously observes the user's digital world and provides intelligent recommendations while leaving deterministic calculations to the Execution Engine.

---

# AI Philosophy

AI should never become the source of truth.

Instead it should provide:

* understanding
* reasoning
* planning
* explanation
* prioritization

The system should remain reliable even when AI is unavailable.

---

# Responsibilities

Motive AI is responsible for:

* discovering goals
* understanding emails
* classifying calendar events
* explaining recommendations
* prioritizing commitments
* generating execution plans
* estimating effort
* summarizing changes

Motive AI should never:

* calculate progress
* update Firestore directly
* modify calendar events
* create relationships without confirmation
* bypass business rules

---

# AI Architecture

```text
                  Motive AI

                        │

      ┌─────────────────┼─────────────────┐

      │                 │                 │

 Discovery         Strategy         Assistant

 Understand         Decide          Explain
```

---

# Discovery

Purpose

Understand incoming information.

Sources

Google Calendar

Gmail

User Input

Future

Slack

GitHub

Jira

Examples

Interview invitation

↓

Possible Career Goal

---

Visa email

↓

Possible Travel Goal

---

Responsibilities

Classify

Extract metadata

Suggest relationships

Estimate confidence

Never modify data.

---

# Strategy

Purpose

Reason about execution.

Input

Goals

Commitments

Calendar

Relationships

Momentum

Risk

Availability

Output

Recommendations

Focus Blocks

Planning Suggestions

Priority

Risk Analysis

The Strategy engine always explains its reasoning.

---

# Assistant

Purpose

Provide natural interaction.

Examples

Explain recommendation.

Summarize today.

Answer questions.

Suggest improvements.

Generate weekly review.

The Assistant should never expose internal implementation details.

---

# AI Request Flow

```text
User

↓

Application

↓

Execution Engine

↓

Motive AI

↓

Structured JSON

↓

Execution Engine

↓

Repositories

↓

UI
```

AI never communicates directly with the UI.

---

# Context

Every AI request receives a Context object.

Context contains

Current Time

Current Goals

Current Commitments

Upcoming Calendar

Recent Timeline

Recent Recommendations

Relevant Knowledge

Only relevant information should be sent.

Avoid unnecessarily large prompts.

---

# Prompt Design

Prompts should be:

Small

Deterministic

Structured

Contextual

Composable

Avoid giant prompts.

Use multiple specialized prompts instead.

---

# AI Contracts

Every AI interaction follows:

Input

↓

Prompt Template

↓

Gemini

↓

Structured JSON

↓

Validation

↓

Execution Engine

↓

UI

No raw AI output reaches the interface.

---

# Confidence

Every AI suggestion contains confidence.

Example

Interview

↓

Career Goal

Confidence

91%

Reason

Interview title and recruiter email strongly match existing Career Goal.

Users should always understand uncertainty.

---

# Explainability

Every recommendation should answer:

Why now?

Why this?

Why not another commitment?

What happens if ignored?

Estimated benefit?

Explainability builds trust.

---

# Recommendation Generation

Inputs

Goals

Commitments

Relationships

Calendar

Risk

Momentum

Knowledge

Outputs

Title

Reason

Impact

Confidence

Estimated Duration

Suggested Action

Recommendations should always remain actionable.

---

# Goal Discovery

AI may discover potential goals from:

Repeated commitments

Calendar patterns

Emails

User conversations

The user must always confirm before a Goal is created.

---

# Relationship Discovery

AI may suggest:

Interview

↓

Career Goal

Passport

↓

France Visa

Doctor Appointment

↓

Health

Relationships remain suggestions until approved.

---

# Calendar Understanding

AI classifies imported events.

Examples

Interview

Meeting

Birthday

Holiday

Doctor

Travel

Study

Deep Work

Workout

This classification improves planning.

---

# Gmail Understanding

Emails should first be summarized.

Only relevant metadata enters the system.

Examples

Interview Invitation

Visa Email

Exam Registration

Flight Ticket

Hotel Booking

Ignore newsletters and promotional emails.

---

# AI Memory

MVP

Disabled.

Future

AI may learn:

Preferred working hours

Common postponements

Typical meeting durations

Frequently blocked goals

This remains optional.

---

# Failure Handling

If AI becomes unavailable

The application should continue operating.

Execution Engine

Recommendations

Timeline

Calendar

should continue functioning.

Only AI-specific features degrade gracefully.

---

# Cost Optimization

Avoid unnecessary AI calls.

Prefer deterministic logic whenever possible.

Cache AI summaries.

Reuse previous responses where appropriate.

Use incremental context.

Only send changed information.

---

# Security

Never send:

API Keys

Secrets

Passwords

Sensitive tokens

Sanitize user input before prompting.

Validate AI responses.

---

# Guiding Principle

AI should reduce cognitive effort.

Not increase it.

Every AI interaction should help users confidently answer:

"What should I do next?"

---

# Long-Term Vision

Future AI capabilities may include:

Weekly Reviews

Goal Forecasting

Automatic Project Breakdown

Meeting Preparation

Travel Planning

Knowledge Graph

Document Understanding

What-if Simulation

Personal Memory

These features should integrate without changing the overall architecture.
