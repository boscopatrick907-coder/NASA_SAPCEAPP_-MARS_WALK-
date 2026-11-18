# Charles / Takou — integrated design and usability

## Active assignment — 18 November 2026, post-submission planning v2

This assignment supersedes every older ACTIVE/NEXT section and deadline below. The previous plans and acceptance records are retained as history, not a new work queue. Completed work stays completed. Preserve and report unpublished changes before starting; do not reset, force-push or replace another agent's implementation.

**Milestone:** choose two points on a real orbital image, preview a path derived from an independently reviewed and aligned DEM, understand its limits, then save and recover the mission offline.

Read [the shared ownership and acceptance plan](../planning/TEAM_PLANNING_V2.md). Start from the coordinator-confirmed integration revision in your own checkout/branch. `science/planning-v2` is the development branch; main and public deployments remain unchanged by these assignments. The existing local terrain-routing foundation is experimental and is not an accepted data contract or runtime feature. Agree contract v1 with Patrick before dependent integration.

Charles and Takou are the same contributor. Own scoped styling/usability work in agreement with Emma, plus `docs/design/PLANNING_V2_POLISH.md`. Start with an audit, not overlapping component rewrites.

1. Audit the current real app and document the ten highest-impact usability issues with screenshots, viewport/theme, affected task and severity. Prioritize map visibility, primary action, route preview versus accepted route, evidence disclosure and save/recovery feedback.
2. Agree a file ownership list with Emma before changing SCSS. Reuse the existing `src/tokens.scss` system and local fonts; no competing token system, dependency or decorative fake telemetry.
3. Polish the integrated flow: inspect terrain availability → choose endpoints → request preview → inspect limitations → accept/reject → record/save/recover. Preserve wording, values, units, sources, credits and limitations. Keep provenance accessible through disclosures rather than deleting it.
4. Verify 1280×800, 820×1180 and 390×844, both themes, 200% zoom, keyboard focus, reduced motion and 44px touch targets. Record measured contrast and actual overflow checks. Keep the image prominent and unsupported states explicit.
5. Run existing tests/build, add focused interaction tests only when behavior changes, and deliver before/after evidence plus AI-use disclosure. Outside-user sessions require real participants and observations; do not invent certification or results.

First handoff is the ranked audit and proposed file list; second is a reviewable styling commit after ownership agreement; final handoff is integrated-flow usability evidence. Do not deploy or edit science, routing, persistence, data or worker logic.

---

## Historical assignments and review records — superseded queue

# Charles — release tasks

## ACTIVE — final 90-minute survival-planning release

Record current real demo and prepare official portal assets/links, with factual limits. Coordinate QA identity/ownership if relaying Takou’s report; do not assume unpublished work is accepted.

Read [the exact shared assignment, ownership and clock](../FINAL_90_MINUTES.md). This section supersedes older future-work lists. Preserve/push existing work first; use current main and stable review URL. First handoff by minute 35, integration freeze at minute 55, submission reserved for final 15 minutes. No inferred safe-route or life-support claims.

