# Team assignments — Planning V2

Open your file below and follow **START HERE**. The current assignments are published on **`main`**. Create feature branches for implementation; do not push task code directly to main. Older sections under historical assignments are reference only.

| Person / agent | Assignment file |
|---|---|
| Gaddielle | [GADDIELLE.md](GADDIELLE.md) |
| Emma — Agent 1 | [EMMA.md](EMMA.md) |
| Emma — Agent 2 | [EMMA 2.md](<EMMA 2.md>) |
| Enzo — Agent 1 | [ENZO.md](ENZO.md) |
| Enzo — Agent 2 | [ENZO 2.md](<ENZO 2.md>) |
| Willy — Agent 1 | [WILLY.md](WILLY.md) |
| Willy — Agent 2 | [WILLY 2.md](<WILLY 2.md>) |
| Royce / Longla | [LONGLA.md](LONGLA.md) |
| Charles / Takou — one person | [CHARLES.md](CHARLES.md) |
| Patrick / coordinator | [YOU.md](YOU.md) |

Read the [shared ownership plan](../planning/TEAM_PLANNING_V2.md) and [step-by-step delivery runbook](../planning/TERRAIN_DELIVERY_RUNBOOK.md) for dependencies, local-download fallback, compact offline package and acceptance gates. Assignment does not mean work is complete or deployed.

**Terrain contract v1 (draft, 20 Nov):** [TERRAIN_CONTRACT_V1.md](../planning/TERRAIN_CONTRACT_V1.md), shared code in `src/app/core/terrain.ts`. Answer your question in its §10 using the runbook handoff format. Source decision status: [ACCEPTANCE.md](../data/terrain-v2/ACCEPTANCE.md) (pending).

### Do-now drafts on feature branches (20 Nov)

The coordinator's coding agent drafted each "Do now" item that doesn't need real data or devices. **Each owner reviews, keeps, changes or discards their branch.** Nothing is merged to main, and no gate is closed by these drafts. If you already have unpublished work for the same item, compare first and keep one.

| Owner | Branch | What's there |
|---|---|---|
| Enzo 2 | `feature/enzo-routing-worker-v2` | Routing engine, worker, client, 21 tests incl. reference solver, `docs/qa/TERRAIN_ROUTING.md` with benchmark |
| Enzo 1 | `feature/enzo-terrain-preparation-v2` | `tools/terrain/prepare_terrain.py` (inspect/extract), 18 synthetic tests, `docs/data/TERRAIN_PREPARATION.md` |
| Willy 2 | `feature/willy-terrain-alignment-qa-v2` | `tests/terrain-map/` (24 independent checks), `docs/qa/PLANNING_V2_ALIGNMENT.md` |
| Willy 1 | `feature/willy-terrain-map-v2` | Proposal only: `docs/qa/PLANNING_V2_MAP.md` |
| Royce | `feature/royce-planning-v2-acceptance` | Browser end-to-end recovery baseline, `docs/qa/PLANNING_V2_RELEASE.md` |
| Charles | `feature/charles-planning-v2-polish` | Ten-issue audit with screenshots, `docs/design/PLANNING_V2_POLISH.md` |
| Gaddielle | `feature/gaddielle-terrain-sources-v2` | Dossier skeleton, retrieval log (official hosts blocked from the cloud) |
| Emma 1 / 2 | (their own branches, already pushed) | Rename to `terrain-v1` types from `src/app/core/terrain.ts` when integrating |

**Update (20 Nov, evening):** the routing, preparation-tool, alignment-test, recovery-test and Gaddielle dossier drafts, plus Emma 1/2's branches (with review fixes), are merged into `claude/magical-volta-1c76ak` and retargeted to the new active image. Willy 1's map proposal was implemented in reduced form (dashed suggestion only). Charles's audit #3 and the bundle budget are fixed there; #1/#2 remain. Owners: review what landed in your area on that branch, not on your old draft branch.
