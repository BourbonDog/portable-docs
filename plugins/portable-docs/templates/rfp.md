<!-- @header -->
<!-- @title value="Response to RFP #2026-114 — Data Platform Modernization" -->
<!-- @subtitle value="A phased, fixed-fee proposal from Northwind Labs for RetailCo." -->
<!-- @eyebrow value="RFP RESPONSE" -->
<!-- @brand value="Northwind Labs" -->
<!-- @brandsub value="Platform Practice" -->
<!-- @date value="June 2026" -->
<!-- @from name="Jordan Mercer" email="jordan@northwindlabs.example" -->
<!-- @footer value="Confidential — submitted in response to RFP #2026-114" -->
<!-- /@header -->

## 1. Executive Summary and Scope

Northwind Labs proposes a phased, fixed-fee modernization of RetailCo's data
platform. Scope covers ingestion, a live query layer, and governance.

<!-- @stats -->
<!-- @stat value="$1.24M" label="Total fixed fee (3-yr)" source="Section 4 pricing" -->
<!-- @stat value="14 wks" label="Time to go-live" source="Phase plan" -->
<!-- @stat value="100%" label="Mandatory requirements met" source="Compliance matrix" -->
<!-- /@stats -->

## 2. Requirements Compliance Matrix

We meet every mandatory requirement in Section 4 of the RFP.

<!-- @table variant="striped" -->
| Requirement (RFP §) | Meets | Notes |
|---|---|---|
| SSO / SAML 2.0 (§4.1) | ✓ | Native; Okta and Entra ID certified |
| Data residency in-region (§4.2) | ✓ | US-only deployment option |
| 99.95% uptime SLA (§4.3) | ✓ | Contractual, with credits |
| On-prem install (§4.7) | ✗ | SaaS-only; hybrid roadmap Q4 |

## 3. Approach and Timeline

<!-- @timeline -->
<!-- @entry year="Weeks 1–4" company="Phase 1" title="Ingestion" highlight="true" -->
Connect all in-scope systems and stand up the schema registry.
<!-- /@entry -->
<!-- @entry year="Weeks 5–10" company="Phase 2" title="Live Query Layer" highlight="false" -->
Ship the sub-second query engine and self-serve builder.
<!-- /@entry -->
<!-- @entry year="Weeks 11–14" company="Phase 3" title="Governance" highlight="false" -->
Row-level permissions, SSO, and audit export.
<!-- /@entry -->
<!-- /@timeline -->

## 4. Pricing

<!-- @table variant="striped" -->
| Line Item | Unit | Qty | Cost |
|---|---|---|---|
| Platform license (annual) | year | 3 | $720,000 |
| Implementation (fixed) | project | 1 | $380,000 |
| Premium support (annual) | year | 3 | $140,000 |

## 5. Terms and Assumptions

- Fixed-fee, milestone-billed.
- Assumes RetailCo provides timely access to in-scope systems.
- Excludes third-party license costs.

## Citations

[1] RetailCo RFP #2026-114, Section 4.
