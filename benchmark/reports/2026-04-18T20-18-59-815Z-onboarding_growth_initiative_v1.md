# Benchmark Summary

## Scenario

- Scenario: Onboarding Growth Initiative - 5 Week Accountability Regression
- Scenario ID: onboarding_growth_initiative_v1
- Started: 2026-04-18T20:18:59.815Z
- Finished: 2026-04-18T20:22:13.694Z
- API base URL: http://127.0.0.1:3102/api/v1
- Systems run: 2
- Total meetings processed: 10
- Aggregate checks: 71 passed / 5 failed
- Best system: current_system

## System Summary

| System | Mode | Passed | Failed | Pass Rate |
| --- | --- | ---: | ---: | ---: |
| Current Stateful Accountability System | stateful_api | 37 | 1 | 97% |
| Transcript-Only Baseline | stateless_transcript_only | 34 | 4 | 89% |

## Comparison

### Ranking

| Rank | System | Passed | Failed | Pass Rate |
| --- | --- | ---: | ---: | ---: |
| 1 | Current Stateful Accountability System | 37 | 1 | 97% |
| 2 | Transcript-Only Baseline | 34 | 4 | 89% |

### Per-meeting scores

| Meeting | Current Stateful Accountability System | Transcript-Only Baseline |
| --- | --- | --- |
| 1. week1_kickoff | 7 / 0 | 7 / 0 |
| 2. week2_status | 6 / 0 | 6 / 0 |
| 3. week3_scope_risk | 6 / 0 | 6 / 0 |
| 4. week4_replan | 6 / 0 | 6 / 0 |
| 5. week5_launch_readiness | 8 / 1 | 8 / 1 |

## Current Stateful Accountability System

- Strategy: Uses the product-memory pipeline through the backend API: transcript storage, structured extraction, reconciliation against prior project state, and final MoM generation.
- Project name: Onboarding Growth Initiative Benchmark 1776543540181
- Meetings processed: 5
- Checks passed: 37
- Checks failed: 1

### Meeting breakdown

| Meeting | Transcript Events | Items | Passed | Failed |
| --- | ---: | ---: | ---: | ---: |
| 1. Onboarding Growth Initiative - Week 1 Kickoff | 16 | 12 | 7 | 0 |
| 2. Onboarding Growth Initiative - Week 2 Status Review | 18 | 9 | 6 | 0 |
| 3. Onboarding Growth Initiative - Week 3 Scope And Risk Review | 19 | 7 | 6 | 0 |
| 4. Onboarding Growth Initiative - Week 4 Replan | 18 | 14 | 6 | 0 |
| 5. Onboarding Growth Initiative - Week 5 Launch Readiness | 19 | 5 | 8 | 1 |

### Failing checks

- Meeting 5: Onboarding Growth Initiative - Week 5 Launch Readiness | meeting_item_presence | cannibalization
  - No matching meeting item title found.

## Transcript-Only Baseline

- Strategy: Analyzes each meeting independently through the backend without prior project memory, database reconciliation, or carry-forward state transitions.
- Meetings processed: 5
- Checks passed: 34
- Checks failed: 4

### Meeting breakdown

| Meeting | Transcript Events | Items | Passed | Failed |
| --- | ---: | ---: | ---: | ---: |
| 1. Onboarding Growth Initiative - Week 1 Kickoff | 16 | 12 | 7 | 0 |
| 2. Onboarding Growth Initiative - Week 2 Status Review | 18 | 8 | 6 | 0 |
| 3. Onboarding Growth Initiative - Week 3 Scope And Risk Review | 19 | 7 | 6 | 0 |
| 4. Onboarding Growth Initiative - Week 4 Replan | 18 | 15 | 6 | 0 |
| 5. Onboarding Growth Initiative - Week 5 Launch Readiness | 19 | 6 | 8 | 1 |

### Failing checks

- Meeting 5: Onboarding Growth Initiative - Week 5 Launch Readiness | meeting_item_presence | cannibalization
  - No matching meeting item title found.
- Final project state | project_item_status | phase one => completed
  - Matching items found, but statuses were: Decision on guest checkout inclusion in phase one=null; Phase one inclusion of guest checkout=null.
- Final project state | project_item_status | launch comms => pending
  - Matching items found, but statuses were: Coordinate launch comms and support training=null; Send final launch comms note=null; Outstanding launch risk due to incomplete launch comms=null.
- Final project state | project_open_absence | guest checkout inclusion in phase one
  - Found open matching item "Decision on guest checkout inclusion in phase one" with status null.

## Interpretation

This benchmark is intended to show whether project memory and accountability-aware reasoning outperform transcript-only analysis on recurring meeting sequences.
