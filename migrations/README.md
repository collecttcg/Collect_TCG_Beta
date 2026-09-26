# Supabase migrations

This directory contains the historical SQL required to reconstruct or audit Collect TCG database changes.

## Rules

- Existing migration filenames are immutable; do not rename legacy or date-versioned migrations.
- Repository presence does **not** mean a migration has been applied.
- New database changes must use a new versioned SQL file.
- Keep migrations rerunnable where practical and preserve RLS/backward compatibility unless the requested change requires otherwise.
- Moving the existing files into this directory in Beta v19 is repository cleanup only; it does not change or reapply the database schema.

## Layout

- `2026/` — date-versioned migrations.
- `legacy/` — legacy `V###` migrations retained for history.
