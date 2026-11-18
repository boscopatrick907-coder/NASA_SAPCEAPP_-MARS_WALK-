# Planning v2 — team execution and acceptance

Updated 18 November 2026, after competition submission. This plan supersedes the old deadline queues, not historical review evidence. No new task is marked complete by assignment. The instructions are published on main. Application code is unchanged by this documentation update; no deployment was performed.

## Start here

Follow the **START HERE** checklist in your personal brief and the [step-by-step source-to-offline runbook](TERRAIN_DELIVERY_RUNBOOK.md). The runbook assigns the local-download fallback, compact package preparation, cache integration and offline tests explicitly. Contract and real-terrain acceptance are still pending; no gate is implied complete.

## Objective

Choose endpoints on real imagery, preview a path derived from a reviewed and aligned measured DEM, understand constraints and unknowns, accept/reject it, then save and recover the mission offline. No safest-path or operational survival claim.

## Ownership

| Contributor | Exclusive implementation area | Task |
|---|---|---|
| Patrick | Scientific admission, shared contracts/transforms, core adapters and integration | [YOU](../team/YOU.md) |
| Gaddielle | `docs/data/terrain-v2/` and agreed source inventory | [GADDIELLE](../team/GADDIELLE.md) |
| Enzo 1 | `tools/terrain/`, preparation documentation | [ENZO](../team/ENZO.md) |
| Enzo 2 | `src/app/terrain/`, worker and routing tests after coordinator handoff | [ENZO 2](<../team/ENZO 2.md>) |
| Willy 1 | `src/app/map/`, terrain/route overlays | [WILLY](../team/WILLY.md) |
| Willy 2 | Independent spatial checks, `tests/terrain-map/` | [WILLY 2](<../team/WILLY 2.md>) |
| Emma 1 | New `src/app/terrain-planner/` | [EMMA](../team/EMMA.md) |
| Emma 2 | New `src/app/terrain-evidence/` | [EMMA 2](<../team/EMMA 2.md>) |
| Royce / Longla | `tests/planning-v2/`, recovery/release QA | [LONGLA](../team/LONGLA.md) |
| Charles / Takou | Design audit and agreed styling files, no overlapping Emma edits | [CHARLES](../team/CHARLES.md) |

These paths allocate ownership, not proof that a folder or API already exists. Agree test-runner wiring before adding dependencies. All shared shell/root integration belongs to Patrick unless explicitly handed off.

## Dependency sequence

1. **Now:** source dossier, preparation tooling with synthetic tests, routing review, UI state specifications, independent alignment test plan, baseline recovery tests and design audit can proceed.
2. **Contract gate:** Patrick and implementers agree versioned grid/provenance, transforms, admission states, request/results and errors before adapters are connected. Existing local routing is experimental and awaits handoff; do not assume it is published or scientifically accepted.
3. **Source gate:** independently confirm product identity, authentic source, hashes, Mars CRS, horizontal/vertical units and datum, coverage, nodata, processing history and uncertainty. Metadata alone is insufficient.
4. **Alignment gate:** reproducible extraction and independent registration evidence establish image-to-grid conversion and tolerance. Regional geology remains context unless its scale and registration support an overlay.
5. **Feature gate:** worker, map preview, controls and evidence views integrate. User confirms acceptance of suggestions; stale results/cancel/failures never overwrite missions.
6. **Release gate:** integrated tests/build, independent alignment checks, actual offline restart and available-device results. Coordinator chooses a separately identified candidate; no automatic production promotion.

If current-crop terrain is unsuitable, document an alternative imagery/DEM study area. Do not fake overlap or reinterpret existing saved coordinates.

## Shared rules

- Preserve unpublished changes first and report their branch/SHA. Use independent checkouts for simultaneous agents; never run competing installs/builds or branch switches in one checkout.
- New work starts from current main or a newer coordinator-confirmed development revision. No blind merges of old task branches and no direct main push.
- Synthetic terrain belongs in tests only. Pixal3D relief is illustrative, not a measured DEM. Brightness is not elevation; segment grade is not local slope or a safety rating.
- Keep scientific wording, sources, credits and limitations. Historical REMS observations are not route weather; coarse geology is not a local obstacle map.
- No inferred readiness, successful installation, device certification or outside-user session. Record actual evidence and keep unrun checks pending.
- Do not deploy or change network/environment configuration as part of an individual assignment.

## Required handoff

Send branch and full commit SHA, base revision, exact files, behavior, tests/checks actually run, evidence paths, blockers and next dependency. Push a reviewable implementation where assigned, not only a status report. Coordinator review determines acceptance; pushed does not mean integrated, deployed or complete.
