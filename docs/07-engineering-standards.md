# Motive — Engineering Standards

**Version:** 1.0

**Status:** Draft

---

# 1. Purpose

This document defines the engineering standards for Motive.

Every contribution should follow these guidelines to ensure:

* consistency
* maintainability
* readability
* scalability
* production-quality code

These standards apply to both AI-generated and human-written code.

---

# 2. Engineering Philosophy

Code should be written as if the project will be maintained for the next five years.

Prefer simplicity over cleverness.

Optimize for readability before optimization.

Every file should have one clear responsibility.

---

# 3. General Principles

Follow:

* SOLID (where appropriate)
* DRY
* KISS
* Composition over Inheritance
* Separation of Concerns

Avoid unnecessary abstraction.

---

# 4. TypeScript Standards

Always use:

```ts
strict: true
```

Never use:

```ts
any
```

Prefer:

```ts
unknown
```

or

proper interfaces.

Use enums only when necessary.

Prefer string literal unions when appropriate.

---

# 5. Folder Structure

```text
src/

app/

components/

layouts/

features/

hooks/

services/

repositories/

types/

utils/

theme/

assets/

contexts/

providers/
```

Each feature owns its own components.

Avoid large shared folders.

---

# 6. Naming Conventions

Components

PascalCase

```
GoalCard.tsx
```

Hooks

camelCase

```
useGoals.ts
```

Types

PascalCase

```
Goal.ts
```

Utilities

camelCase

```
formatDate.ts
```

Constants

UPPER_CASE

```
DEFAULT_TIMEOUT
```

---

# 7. Component Rules

Prefer functional components.

Avoid class components.

Components should normally remain below:

200 lines

Extract repeated logic into hooks.

Extract repeated UI into reusable components.

---

# 8. Hooks

Custom hooks should encapsulate:

Fetching

Mutations

Business orchestration

Examples

```
useGoals()

useCalendar()

useRecommendations()
```

Avoid UI logic inside hooks.

---

# 9. Services

Services communicate with:

Firestore

Gemini

Google APIs

Repositories

Services should never render UI.

---

# 10. Repository Pattern

Repositories abstract persistence.

Never access Firestore directly from components.

Example

```
GoalRepository

CommitmentRepository

CalendarRepository
```

---

# 11. Error Handling

Return typed results.

Preferred pattern

```
Success

Failure

Loading
```

Avoid throwing uncaught exceptions.

Display meaningful user-facing messages.

---

# 12. Logging

Development

Verbose

Production

Minimal

Never log

Tokens

Secrets

Passwords

Private Email Content

---

# 13. Async Programming

Prefer

async/await

Avoid nested promises.

Handle cancellation where appropriate.

Never ignore rejected promises.

---

# 14. Forms

Use

React Hook Form

Validation

Zod

Display inline validation messages.

---

# 15. Styling

Use

Tailwind CSS

Avoid inline styles.

Prefer utility classes.

Extract reusable patterns into components.

---

# 16. Design Tokens

Use shared variables for

Spacing

Typography

Radius

Colors

Animation

Never hardcode values repeatedly.

---

# 17. State Management

Local state

Default choice.

Context

Authentication

Theme

Settings

Server state

React Query

Avoid unnecessary global stores.

---

# 18. API Communication

Every request should have

Loading

Success

Failure

Retry

States.

Never block the UI.

---

# 19. AI Integration

Gemini responses should always be validated.

Never trust AI output blindly.

Always verify JSON before use.

Gracefully handle malformed responses.

---

# 20. Performance

Use

React.memo

useMemo

useCallback

only when beneficial.

Avoid premature optimization.

Lazy load pages.

Code split routes.

---

# 21. Accessibility

Every interactive element must have:

Keyboard support

Focus state

Accessible label

Semantic HTML

Support reduced motion.

---

# 22. Testing

Business Logic

Unit Tests

Repositories

Integration Tests

Critical Flows

End-to-End Tests

Write code that is easy to test.

---

# 23. Comments

Prefer self-documenting code.

Only comment:

Complex algorithms

Business rules

Architectural decisions

Avoid explaining obvious code.

---

# 24. Security

Never expose secrets.

Validate user input.

Escape rendered HTML.

Sanitize AI responses.

Follow least privilege.

---

# 25. Git Strategy

Branch names

```
feature/calendar-sync

feature/dashboard

fix/theme

docs/domain-model
```

Commit messages

```
feat:

fix:

refactor:

docs:

style:

test:

chore:
```

Example

```
feat: implement calendar synchronization

fix: resolve recommendation refresh bug

docs: add AI architecture
```

---

# 26. Pull Request Checklist

Before merging

✅ Types compile

✅ No console logs

✅ No TODOs

✅ Responsive

✅ Dark mode

✅ Loading states

✅ Error states

✅ Accessibility checked

---

# 27. Do

Write reusable code.

Prefer composition.

Separate business logic.

Think long term.

Keep files focused.

Use meaningful names.

---

# 28. Don't

Don't duplicate code.

Don't bypass repositories.

Don't mix UI and business logic.

Don't trust AI blindly.

Don't hardcode values.

Don't create giant components.

---

# 29. Guiding Principle

Every engineer working on Motive should ask:

> "Would this still make sense one year from now?"

If the answer is no, redesign before implementing.
