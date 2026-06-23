<!-- @header -->
<!-- @from name="Dana Lin" email="dana@acmelabs.example" -->
<!-- @date value="Spring 2026" -->
<!-- @title value="Designing Resilient Systems" -->
<!-- @subtitle value="A field guide to building software that bends without breaking." -->
<!-- @eyebrow value="Engineering Field Guide" -->
<!-- @brand value="Acme Labs" -->
<!-- @brandsub value="Platform Engineering" -->
<!-- @footer value="© Acme Labs" -->
<!-- /@header -->

# Designing Resilient Systems

*A field guide to building software that bends without breaking.*

## Why Resilience Matters

Modern systems fail in unpredictable ways. The goal is not to prevent every
failure but to degrade gracefully when failures happen.

Resilience is a property of the whole system, not any single component.

### The Three Pillars

- Redundancy keeps spare capacity ready.
- Isolation contains blast radius.
- Observability makes failure visible.

## Comparing Strategies

The table below summarizes common trade-offs across resilience strategies.

| Strategy | Cost | Recovery Speed |
|----------|------|----------------|
| Active-active | High | Instant |
| Warm standby | Medium | Minutes |
| Cold backup | Low | Hours |

> The person who plans for failure ships systems that survive it.

A numbered playbook helps teams respond consistently under pressure:

1. Detect the failure with health checks.
2. Contain it by shedding load.
3. Recover by failing over to a healthy replica.
