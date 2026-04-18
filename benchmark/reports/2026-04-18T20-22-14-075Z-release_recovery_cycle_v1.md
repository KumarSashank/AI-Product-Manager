# Benchmark Summary

## Scenario

- Scenario: Release Recovery Cycle - 4 Week Reliability Regression
- Scenario ID: release_recovery_cycle_v1
- Started: 2026-04-18T20:22:14.075Z
- Finished: 2026-04-18T20:24:09.480Z
- API base URL: http://127.0.0.1:3102/api/v1
- Systems run: 2
- Total meetings processed: 8
- Aggregate checks: 51 passed / 17 failed
- Best system: current_system

## System Summary

| System | Mode | Passed | Failed | Pass Rate |
| --- | --- | ---: | ---: | ---: |
| Current Stateful Accountability System | stateful_api | 28 | 6 | 82% |
| Transcript-Only Baseline | stateless_transcript_only | 23 | 11 | 68% |

## Comparison

### Ranking

| Rank | System | Passed | Failed | Pass Rate |
| --- | --- | ---: | ---: | ---: |
| 1 | Current Stateful Accountability System | 28 | 6 | 82% |
| 2 | Transcript-Only Baseline | 23 | 11 | 68% |

### Per-meeting scores

| Meeting | Current Stateful Accountability System | Transcript-Only Baseline |
| --- | --- | --- |
| 1. week1_incident_kickoff | 7 / 0 | 7 / 0 |
| 2. week2_stabilization_review | 5 / 2 | 4 / 3 |
| 3. week3_gate_review | 6 / 1 | 5 / 2 |
| 4. week4_recovery_readiness | 7 / 2 | 5 / 4 |

## Current Stateful Accountability System

- Strategy: Uses the product-memory pipeline through the backend API: transcript storage, structured extraction, reconciliation against prior project state, and final MoM generation.
- Project name: Release Recovery Cycle Benchmark 1776543734309
- Meetings processed: 4
- Checks passed: 28
- Checks failed: 6

### Meeting breakdown

| Meeting | Transcript Events | Items | Passed | Failed |
| --- | ---: | ---: | ---: | ---: |
| 1. Release Recovery Cycle - Week 1 Incident Kickoff | 12 | 7 | 7 | 0 |
| 2. Release Recovery Cycle - Week 2 Stabilization Review | 13 | 8 | 5 | 2 |
| 3. Release Recovery Cycle - Week 3 Gate Review | 14 | 5 | 6 | 1 |
| 4. Release Recovery Cycle - Week 4 Recovery Readiness | 12 | 6 | 7 | 2 |

### Failing checks

- Meeting 2: Release Recovery Cycle - Week 2 Stabilization Review | meeting_item_presence | feature flag
  - No matching meeting item title found.
- Meeting 2: Release Recovery Cycle - Week 2 Stabilization Review | meeting_summary_phrase | launch gate
  - Phrase missing from meeting summary.
- Meeting 3: Release Recovery Cycle - Week 3 Gate Review | meeting_item_presence | fallback flow
  - No matching meeting item title found.
- Meeting 4: Release Recovery Cycle - Week 4 Recovery Readiness | meeting_item_presence | alert tuning
  - No matching meeting item title found.
- Meeting 4: Release Recovery Cycle - Week 4 Recovery Readiness | meeting_item_presence | support macro
  - No matching meeting item title found.
- Final project state | project_item_status | alert tuning => pending
  - Matching items found, but statuses were: Add postmortem, alert tuning, and launch checklist as first-class items=completed.

## Transcript-Only Baseline

- Strategy: Analyzes each meeting independently through the backend without prior project memory, database reconciliation, or carry-forward state transitions.
- Meetings processed: 4
- Checks passed: 23
- Checks failed: 11

### Meeting breakdown

| Meeting | Transcript Events | Items | Passed | Failed |
| --- | ---: | ---: | ---: | ---: |
| 1. Release Recovery Cycle - Week 1 Incident Kickoff | 12 | 7 | 7 | 0 |
| 2. Release Recovery Cycle - Week 2 Stabilization Review | 13 | 5 | 4 | 3 |
| 3. Release Recovery Cycle - Week 3 Gate Review | 14 | 5 | 5 | 2 |
| 4. Release Recovery Cycle - Week 4 Recovery Readiness | 12 | 3 | 5 | 4 |

### Failing checks

- Meeting 2: Release Recovery Cycle - Week 2 Stabilization Review | meeting_item_presence | feature flag
  - No matching meeting item title found.
- Meeting 2: Release Recovery Cycle - Week 2 Stabilization Review | meeting_item_presence | dashboard
  - No matching meeting item title found.
- Meeting 2: Release Recovery Cycle - Week 2 Stabilization Review | meeting_summary_phrase | launch gate
  - Phrase missing from meeting summary.
- Meeting 3: Release Recovery Cycle - Week 3 Gate Review | meeting_item_presence | alert tuning
  - No matching meeting item title found.
- Meeting 3: Release Recovery Cycle - Week 3 Gate Review | meeting_summary_phrase | May 20
  - Phrase missing from meeting summary.
- Meeting 4: Release Recovery Cycle - Week 4 Recovery Readiness | meeting_item_presence | launch checklist
  - No matching meeting item title found.
- Meeting 4: Release Recovery Cycle - Week 4 Recovery Readiness | meeting_item_presence | postmortem
  - No matching meeting item title found.
- Meeting 4: Release Recovery Cycle - Week 4 Recovery Readiness | meeting_item_presence | support macro
  - No matching meeting item title found.
- Meeting 4: Release Recovery Cycle - Week 4 Recovery Readiness | meeting_summary_phrase | vendor
  - Phrase missing from meeting summary.
- Final project state | project_item_status | launch checklist => completed
  - Matching items found, but statuses were: Complete launch checklist=null.
- Final project state | project_item_status | alert tuning => pending
  - Matching items found, but statuses were: Complete alert tuning=null.

## Interpretation

This benchmark is intended to show whether project memory and accountability-aware reasoning outperform transcript-only analysis on recurring meeting sequences.
