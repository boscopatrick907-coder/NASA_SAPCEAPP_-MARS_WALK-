# Planning V2 — coordinator review of contributor branches (20 Nov 2026)

Reviewed by the coordinator's coding agent at the coordinator's request. Each verdict lists what I ran. "Accept with changes" means the branch can be integrated once the listed changes are made, by the owner or by the coordinator at integration time with the owner informed.

## Emma 1 — `feature/emma-terrain-planner-v2` @ f7317cd

**Verdict: accept with changes.** Clean, well-isolated component: standalone, OnPush, inputs/outputs only, no storage or map access. Good failure copy and preservation notes throughout. Ran: full suite on the branch (321 pass) and build.

| # | Severity | Finding | Where | Change |
|---|---|---|---|---|
| E1-1 | **High** | An `accepted` package with `offlineReady` **missing** (undefined) enables requests. Only an explicit `false` blocks. That contradicts contract §7: readiness must be proven, not assumed | `evaluateTerrainGate` | Require `offlineReady === true` |
| E1-2 | **High (integration)** | The component makes its own `tp-req-N` ids and marks a preview stale when `preview.requestId !== lastRequestId`. The worker client generates its own ids, so every real result would show as stale and Accept would never enable | `onRequestPreview`, `evaluatePreviewStaleness` | One id source: the integration passes the planner's id to the worker client (`request(input, requestId)`), or the planner adopts the id the client returns. Use `crypto.randomUUID()` per contract §6 |
| E1-3 | Medium | With **no active image** (`activeImageRef` null) an accepted package passes the image check | `evaluateTerrainGate` (`if (activeRef && …)`) | Treat a missing active image as `image-ref-mismatch` |
| E1-4 | Medium | Two different default limits: 15° and 25 % (25 % ≈ 14.0°, 15° ≈ 26.8 %) | `DEFAULT_GRADE_CONSTRAINTS` | One default (15°). Show the percent equivalent; send degrees (`maxSegmentGradeDeg`) per contract §5 |
| E1-5 | Low | `grade-limit-exceeded` copy says "every candidate path exceeded…". The contract defines it as the start or destination having no edge within the cap | `OUTCOME_COPY` | Reword: "Start or destination has no neighbouring cell within the selected grade limit." |
| E1-6 | Low | Types and `'v1-proposal'` constants are duplicated locally | `terrain-planner.models.ts` | Import from `src/app/core/terrain.ts` (`terrain-v1`) on integration |

## Emma 2 — `feature/emma-terrain-evidence-v2` @ 599c9c3

**Verdict: accept, minor changes.** The trust handling is right: hashes, filled metadata and `claimedVerified` never promote anything; `accepted` needs reviewer, UTC date and evidence or it's shown as pending; links pass `https()` and open with `noopener noreferrer`. Ran: full suite on the branch (330 pass) and build.

| # | Severity | Finding | Change |
|---|---|---|---|
| E2-1 | Low | No active image + accepted package shows "Accepted" as aligned (display only; it doesn't enable routing) | Show "No active image" instead |
| E2-2 | Low | Local copies of contract types | Import from `core/terrain.ts` on integration |
| E2-3 | Info | Real metadata is now available (see [ACCEPTANCE.md](../data/terrain-v2/ACCEPTANCE.md)) | Use it for a manual check of long-text and empty-field layouts |

## Takou — `main` @ 5436b6d (PR #6, merged today)

**Verdict: accepted (already on main); one environment note.** It adds `mission-recovery-sessions.spec.ts` (9 tests), an isolated Playwright smoke harness with its own lockfile, a design review and demo docs. No app code changed. Ran:

- `npm test` on `claude/magical-volta-1c76ak` after merging main: **345 / 345 pass** (includes Takou's 9).
- The smoke harness, in a scratch copy pointed at this machine's Chromium (build 1243; Chrome isn't installed): steps 1–6 pass. In step 7 every recovery assertion passes (restored message, exact route rows, note after a full offline restart), then the export download fails with "browser has been closed". The harness pins Playwright 1.64.1 against a 1.63-era Chromium, so I treat this as a harness/browser mismatch, not an app failure: the same export-after-offline-restart passes in Royce's test on the same build. Steps 8–9 didn't run. **Not confirmed here**; re-run with Chrome as the README intends.

## Drafts made by the coordinator's agent (not self-reviewed)

`feature/enzo-routing-worker-v2`, `feature/enzo-terrain-preparation-v2`, `feature/willy-terrain-alignment-qa-v2`, `feature/willy-terrain-map-v2`, `feature/royce-planning-v2-acceptance`, `feature/charles-planning-v2-polish`, `feature/gaddielle-terrain-sources-v2` are my own drafts. Reviewing them myself would not be independent, so they still need their owners' review.
