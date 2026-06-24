<!-- @header -->
<!-- @title value="Atlas Changelog" -->
<!-- @subtitle value="All notable changes to Atlas, newest first." -->
<!-- @eyebrow value="CHANGELOG" -->
<!-- @brand value="Northwind Labs" -->
<!-- @date value="June 2026" -->
<!-- @footer value="Follows Keep a Changelog and Semantic Versioning" -->
<!-- /@header -->

# Atlas Changelog

*All notable changes to this project, newest first.*

## Unreleased

### Added
- Work in progress that has not shipped yet.

## 1.2.0 — 2026-06-20

### Added
- `--type` document types: résumé, case study, changelog, newsletter, landing, RFP.
- Type-aware linting that warns on missing or malformed sections.

### Changed
- Release headings now sort newest-first by convention.

### Fixed
- Empty release sections now surface a warning during linting.

## 1.1.0 — 2026-05-02

### Added
- Data-driven charts and native diagrams in all three formats.

### Deprecated
- The legacy `growth` chart alias; prefer the explicit types.

### Security
- Hardened the build-time render harness against script-injection in inline content.

## 1.0.0 — 2026-04-01

### Added
- Initial public release: proposal, article, and slides formats from one CLI.
