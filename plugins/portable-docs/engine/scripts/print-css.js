'use strict';
/**
 * print-css.js — single source of truth for @media print rules.
 * Injected into output by generateHTML (wrap-html.js). Screen-only chrome
 * carries the class `pd-no-print`; collapsible bodies carry `pd-collapsible`.
 */

const PRINT_CSS = `
    .pd-print-only { display: none; }
    @media print {
      .pd-no-print { display: none !important; }
      .pd-print-only { display: block !important; }
      .pd-collapsible { max-height: none !important; overflow: visible !important; }
      .pd-card, .pd-figure, figure, blockquote, .pd-stat, .pd-testimonial { break-inside: avoid; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      html, body { overflow: visible !important; height: auto !important; }
      @page { margin: 0.75in; }
    }`;

const SLIDES_PRINT_CSS = `
    @media print {
      @page { size: landscape; margin: 0; }
      html, body { overflow: visible !important; height: auto !important; }
      .pd-slide-page { break-after: page; width: 100%; min-height: 100vh; }
      .pd-slide-page:last-child { break-after: auto; }
    }`;

// Résumé compact CV mode — applies on SCREEN and PRINT for `--type resume`.
// Inert unless the document carries html[data-pd-type="resume"]; targets only
// existing component classes (no render-code changes). Reuses the Timeline's
// built-in mobile single-column layout and collapses the full-viewport hero so
// the output reads as a scannable CV, not a magazine cover.
const RESUME_CSS = `
    html[data-pd-type="resume"] header { min-height: 0 !important; }
    html[data-pd-type="resume"] header h1 { font-size: clamp(2rem, 5vw, 3.5rem) !important; }
    html[data-pd-type="resume"] .hero-quote { display: none !important; }
    html[data-pd-type="resume"] .hero-main { grid-column: span 12 !important; }
    /* The "Scroll to explore" indicator is the last <div> child of the hero <header> and has no class of its own. */
    html[data-pd-type="resume"] header > div:last-of-type { display: none !important; }
    html[data-pd-type="resume"] .timeline-entry {
      grid-template-columns: 60px 1fr !important; min-height: auto !important;
      gap: 12px !important; opacity: 1 !important; transform: none !important;
    }
    html[data-pd-type="resume"] .timeline-left { display: none !important; }
    html[data-pd-type="resume"] .timeline-right { display: block !important; }
    html[data-pd-type="resume"] .timeline-mobile-only { display: block !important; }
    html[data-pd-type="resume"] .timeline-card { max-width: 100% !important; }
    html[data-pd-type="resume"] .timeline-card-arrow { display: none !important; }
    @media print {
      html[data-pd-type="resume"] .timeline-entry,
      html[data-pd-type="resume"] .timeline-card { break-inside: avoid; }
    }`;

module.exports = { PRINT_CSS, SLIDES_PRINT_CSS, RESUME_CSS };
