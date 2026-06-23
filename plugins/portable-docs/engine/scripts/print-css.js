'use strict';
/**
 * print-css.js — single source of truth for @media print rules.
 * Injected into output by generateHTML (wrap-html.js). Screen-only chrome
 * carries the class `pd-no-print`; collapsible bodies carry `pd-collapsible`.
 */

const PRINT_CSS = `
    @media print {
      .pd-no-print { display: none !important; }
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

module.exports = { PRINT_CSS, SLIDES_PRINT_CSS };
