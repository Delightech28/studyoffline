/**
 * Serves a dynamically generated 192×192 PWA icon.
 * Uses SVG → PNG via the Response API.
 * This avoids needing to commit binary PNG files to the repo.
 */
export function GET() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <!-- Background -->
  <rect width="192" height="192" rx="40" fill="#2563eb"/>
  <!-- Book icon (white) -->
  <g transform="translate(36, 32)">
    <path d="M60 21.2A44.8 44.8 0 0 0 30 10.6c-5.2 0-10.3.9-15 2.6v71.3A44.9 44.9 0 0 1 30 82.5c11.5 0 22 4.3 30 11.5m0-72.8a44.8 44.8 0 0 1 30-10.6c5.2 0 10.3.9 15 2.6v71.3A44.9 44.9 0 0 0 90 82.5c-11.5 0-22 4.3-30 11.5m0-72.8v72.8"
      fill="none" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Wifi crossed out badge -->
  <circle cx="148" cy="148" r="28" fill="#1e40af"/>
  <g transform="translate(130, 130)">
    <line x1="2" y1="2" x2="34" y2="34" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <path d="M10 24a12 12 0 0 1 8-3" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 32 L18.1 32" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`.trim();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
