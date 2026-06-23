<!-- @header -->
<!-- @title value="Q2 2026 Company Recap" -->
<!-- @subtitle value="What we shipped, what we learned, and what comes next." -->
<!-- @brand value="Northwind Labs" -->
<!-- @brandsub value="All Hands — June 2026" -->
<!-- @date value="June 2026" -->
<!-- @footer value="Internal — Northwind Labs" -->
<!-- /@header -->

---

## Q2 at a Glance

Three big bets, all shipped.

- **Atlas v2** launched to 40 enterprise accounts on April 14.
- **Connector Library** grew from 10 to 28 integrations.
- **Governance module** shipped June 1 — ahead of schedule by two weeks.

Revenue crossed the $1M ARR milestone in May.

---

## What We Shipped

### Product

- Atlas v2: live query engine with sub-second SLA on joined datasets
- Self-serve query builder (no SQL required)
- Row-level permissions and SSO integration
- 18 new connectors: Salesforce, HubSpot, Snowflake, and 15 more

### Engineering

- Moved CI pipeline to parallel runners — build time dropped from 14 min to 4 min
- Achieved 99.97% uptime in Q2 (target: 99.9%)
- Shipped zero-downtime migration for all existing customer schemas

---

## Key Metrics

| Metric | Q1 2026 | Q2 2026 | Change |
|---|---|---|---|
| ARR | $620k | $1.04M | +68% |
| Active accounts | 21 | 40 | +90% |
| Avg. time to first insight | 3 days | 18 hrs | -75% |
| NPS | 42 | 61 | +19 pts |
| Support tickets (per account) | 4.2 | 1.8 | -57% |

---

## What We Learned

> Customers don't want more connectors. They want the connectors they have to work perfectly.

Our Q2 NPS jump came from reliability and polish, not feature count.
Three things that moved the needle:

1. **Connector health dashboard** — customers can see replication lag in real time.
   Support ticket volume dropped 40% the week it shipped.
2. **Onboarding flow redesign** — time to first insight fell from 3 days to 18 hours.
3. **Quarterly business reviews** — accounts that had a QBR with us had 3x lower
   churn risk than those that did not.

---

## Q3 Plan

### What We Are Focused On

- **Enterprise tier launch** — SOC 2 Type II cert clears in July; GA follows.
- **API access** — self-serve API keys so customers can build on top of Atlas.
- **Mobile alerts** — Beacon integration ships in August.
- Grow to 70 paying accounts by September 30.

### What We Are Not Doing

We cut three features that were on the original Q3 roadmap:

- Native BI embedding (moved to Q4 — not blocking any renewals)
- Slack bot v2 (existing v1 has sufficient NPS)
- White-label mode (no qualified prospect has asked for it)

---

## Thank You

Q2 was the quarter we stopped being a startup and started being a company.

Every person in this room shipped something that is running in production for a
paying customer. That is the only metric that matters right now.

Q3 target: 70 accounts, $1.6M ARR, zero churn.

Let's build.

