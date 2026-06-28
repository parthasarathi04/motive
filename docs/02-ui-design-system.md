# Motive — UI Design System

**Version:** 1.0

**Status:** Draft

---

# 1. Purpose

The user interface of Motive should feel like a premium productivity product rather than an enterprise dashboard.

Users should immediately experience:

* Calm
* Clarity
* Focus
* Confidence

The interface should reduce cognitive load instead of adding to it.

Every visual element should have a purpose.

---

# 2. Design Philosophy

The UI should embody five core principles.

## Calm

Never overwhelm the user.

Show only the most important information.

Whitespace is preferred over dense layouts.

---

## Intelligent

The interface should feel proactive.

Instead of displaying raw information, surface meaningful insights.

Example:

❌

"You have 12 tasks."

✅

"Completing your passport scan today unlocks your visa appointment."

---

## Minimal

Avoid unnecessary decorations.

Every button, icon and card should justify its existence.

---

## Premium

The experience should resemble products such as:

* Linear
* Arc Browser
* Notion
* Vercel
* Stripe Dashboard

Not enterprise administration panels.

---

## Human

AI should sound supportive.

Never robotic.

Never overwhelming.

---

# 3. Visual Identity

## Personality

Modern

Minimal

Thoughtful

Elegant

Premium

Confident

Professional

---

## Avoid

Gamified interfaces

Bright gradients

Flashy animations

Heavy shadows

Dense dashboards

Corporate admin panels

---

# 4. Layout

Desktop

```text
┌──────────────┬──────────────────────────────┬───────────────┐
│              │                              │               │
│              │                              │               │
│   Sidebar    │        Main Workspace        │  AI Sidebar   │
│              │                              │               │
│              │                              │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

---

Sidebar Width

280px

Main Workspace

Fluid

AI Sidebar

360px

---

Tablet

Collapse AI Sidebar

---

Mobile

Bottom Navigation

Single Column

---

# 5. Navigation

Primary Navigation

Dashboard

Goals

Calendar

Commitments

Insights

Notifications

Settings

Maximum

8 menu items.

---

# 6. Dashboard Philosophy

The dashboard is a decision screen.

Not a reporting screen.

The first screen should answer:

What changed?

What should I do?

Why?

Am I on track?

---

# 7. Hero Section

Every dashboard begins with:

```
Good Morning, Partha

You have 3 active goals.

1 goal needs attention.

Your next best action takes only 20 minutes.
```

This section should feel conversational.

---

# 8. Cards

Cards are the primary information container.

Every card should contain:

Title

Supporting Information

Primary Action

Optional Secondary Action

Cards should never exceed 3 information levels.

---

Corner Radius

20px

Padding

24px

Gap

20px

---

# 9. Typography

Primary Font

Inter

Fallback

System Sans

---

Weights

Regular

Medium

Semibold

Avoid Bold.

---

Hierarchy

Display

32

Heading

24

Section

18

Body

15

Caption

13

---

# 10. Colors

Light Theme

Background

Warm White

Cards

Pure White

Primary Accent

Emerald

Secondary Accent

Indigo

Warning

Amber

Error

Coral

Text

Slate

---

Dark Theme

Background

Almost Black

Cards

Dark Slate

Accent

Emerald

Text

Warm White

Borders

Gray

---

Avoid:

Pure Black

Pure White

Bright Red

Neon Colors

---

# 11. Icons

Use

Lucide Icons

only.

Maintain one icon style throughout the application.

---

# 12. Buttons

Variants

Primary

Secondary

Ghost

Danger

Loading

Disabled

---

Primary Buttons

Filled

Rounded

Minimal Shadow

---

# 13. Inputs

Rounded

14px

Clear labels

Helpful placeholders

Inline validation

---

# 14. Recommendation Card

Every recommendation contains:

Recommendation

Reason

Expected Impact

Estimated Duration

Confidence

Primary Action

Example

```
Upload Passport Copy

Reason

Blocks Visa Appointment

Estimated Time

15 minutes

Confidence

94%

Impact

+12 Momentum
```

---

# 15. Goal Card

Each Goal displays

Title

Momentum

Risk

Progress

Next Best Action

Deadline

Keep concise.

---

# 16. Calendar View

Motive is not a calendar application.

Instead of replicating Google Calendar, display:

Focus Blocks

Meetings

Conflicts

Free Time

Recommendations

Google Calendar remains the editing experience.

---

# 17. AI Sidebar

Persistent on Desktop.

Capabilities

Explain Recommendation

Summarize Today

Replan Day

Ask Questions

Review Suggestions

The AI Sidebar should never replace the main workflow.

---

# 18. Loading

Never use spinning loaders.

Always use:

Skeleton Cards

Skeleton Lists

Skeleton Calendar

Skeleton Dashboard

---

# 19. Empty States

Every empty state should encourage progress.

Example

"No active goals yet."

↓

"Let's create your first execution plan."

---

# 20. Notifications

Avoid generic reminders.

Examples

✔ Interview invitation detected.

✔ Calendar conflict found.

✔ Recommendation updated.

✔ Goal risk increased.

Every notification should encourage meaningful action.

---

# 21. Motion

Animations

Subtle

Fast

Natural

Maximum Duration

250ms

Use Framer Motion.

Avoid excessive movement.

---

# 22. Accessibility

Keyboard Navigation

Visible Focus States

ARIA Labels

Reduced Motion

High Contrast

Responsive Layout

WCAG AA where practical.

---

# 23. Micro Interactions

Instead of instantly updating recommendations:

```
Analyzing your schedule...

✓ New recommendation ready
```

Instead of:

```
Calendar Synced
```

Display:

```
2 new events detected.

Replanning your day...
```

These small interactions make the application feel alive.

---

# 24. Responsive Behaviour

Desktop

Three Columns

Tablet

Two Columns

Mobile

Single Column

Bottom Navigation

No horizontal scrolling.

---

# 25. Design Rules

Prefer

Whitespace

Cards

Rounded Corners

Soft Borders

Readable Typography

Avoid

Large Tables

Dense Lists

Complex Forms

Nested Menus

---

# 26. Inspiration

Use these products only as inspiration.

Linear

Notion

Arc Browser

Raycast

Vercel

Stripe Dashboard

Capture their simplicity, not their appearance.

---

# 27. Ultimate Goal

Every screen should answer one question:

> **What matters next?**

If the answer is immediately visible, the design has succeeded.
