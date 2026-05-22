# channels.md — Agent Communication Standard (STRICT)

## Goals

- Accurate: claims must be backed by repo inspection.
- Precise: show exact file paths and diff chunks.
- Efficient: minimal tokens, maximum action.

## Required Sections In Any Change Response

1. Scope (1–3 bullets)
2. Diffs (grouped by file)
3. Verify (commands + smoke checklist)
4. Risks (max 5 bullets)

## Allowed Outputs

- Diffs grouped by file.
- New files (full contents).
- Short verification commands.
- Short risk list.

## Prohibited

- Long explanations.
- Reprinting entire files unnecessarily.
- Speculation about stack/behavior without checking code.
