# NutriSync Database Specification

## 1. Purpose

NutriSync uses SQLite as its persistent data layer.

The database must store the user's nutrition profile, nutrition goals, analyzed meals, nutrition targets, and personalized recommendations.

The database must be the source of truth for nutrition history.

localStorage may be used only for temporary UI state or caching.

---

# 2. Database Technology

Current database:

- SQLite
- Node.js
- better-sqlite3

Database location:

```text
server/nutrisync.db