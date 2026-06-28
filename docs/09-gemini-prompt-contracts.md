# Motive — Gemini Prompt Contracts

**Version:** 1.0

---

# Purpose

This document defines every interaction between Motive and Gemini.

The objective is to make AI predictable, deterministic, testable and reusable.

Gemini should behave as a reasoning engine.

Business rules remain inside the Execution Engine.

---

# AI Design Principles

Every prompt must:

- Have one responsibility
- Receive structured JSON
- Return structured JSON
- Avoid unnecessary context
- Avoid chain-of-thought outputs
- Be deterministic whenever possible

---

# General Prompt Template

Every prompt follows the same structure.

System

↓

Role

↓

Instructions

↓

Context

↓

Expected Output Schema

↓

User Data

This keeps prompts reusable.

---

# Global System Prompt

You are Motive AI.

You help users execute meaningful goals.

You never invent facts.

You only use the information provided.

Always explain recommendations.

Return JSON only.

Never return Markdown.

Never return code blocks.

Never return conversational text.

---

# Shared Context

Every request receives:

Current Time

Timezone

Goals

Commitments

Upcoming Calendar

Recent Timeline

User Preferences

Only include relevant objects.

Avoid large prompts.

---

# Prompt 1

Goal Planning

Purpose

Expand a Goal into executable commitments.

Input

{
    goal,
    deadline,
    calendar,
    userPreferences
}

Output

{
    commitments: [],
    dependencies: [],
    estimatedDuration,
    explanation
}

Example

Goal

France Visa

↓

Suggested Commitments

Passport

Insurance

Bank Statement

Appointment

Travel Documents

---

# Prompt 2

Relationship Discovery

Purpose

Determine whether a Commitment belongs to an existing Goal.

Input

Goal

Commitment

Timeline

Output

{
    confidence,
    relationship,
    explanation
}

Example

Interview

↓

Career Goal

Confidence

94%

---

# Prompt 3

Recommendation

Purpose

Generate the highest-value recommendation.

Input

Goals

Commitments

Momentum

Calendar

Risk

Output

{
    recommendation,
    reason,
    impact,
    duration,
    confidence
}

Recommendations should always be actionable.

---

# Prompt 4

Explain Recommendation

Purpose

Generate a human explanation.

Input

Recommendation

Reason

Timeline

Output

{
    explanation
}

Example

Uploading your passport today unlocks your visa appointment and reduces overall risk.

---

# Prompt 5

Email Understanding

Purpose

Extract useful information from Gmail.

Input

Subject

Sender

Snippet

Output

{
    category,
    summary,
    importance,
    suggestedGoal,
    confidence
}

Ignore newsletters.

Ignore advertisements.

Ignore promotions.

---

# Prompt 6

Calendar Classification

Purpose

Classify imported events.

Input

Calendar Event

Output

{
    type,
    movable,
    category,
    explanation
}

Example

Interview

↓

FIXED

Career

---

# Prompt 7

Daily Brief

Purpose

Generate today's summary.

Input

Goals

Calendar

Recommendations

Timeline

Output

{
    greeting,
    summary,
   focusAreas,
   recommendation,
   closingMessage
}

---

# Prompt 8

Weekly Review

Purpose

Summarize the week.

Input

Timeline

Goals

Recommendations

Output

{
   wins,
   missedOpportunities,
   biggestRisk,
   nextWeekFocus
}

---

# Validation

Every AI response must pass validation.

Check

Required fields

Data types

Enums

Confidence

Maximum lengths

Reject malformed responses.

---

# Retry Strategy

If parsing fails

Retry once.

If retry fails

Fallback to deterministic logic.

---

# Cost Optimization

Avoid duplicate prompts.

Cache summaries.

Reuse classifications.

Batch similar requests.

Only call Gemini when reasoning is required.

---

# Error Handling

If Gemini becomes unavailable

Continue operating.

Hide AI-specific functionality.

Never block the application.

---

# Guiding Principle

AI should answer only questions that require reasoning.

Everything else should be solved deterministically.