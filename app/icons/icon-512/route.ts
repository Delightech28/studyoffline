/**
 * Serves a dynamically generated 512×512 PWA icon.
 */
export function GET() {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="100" fill="#2563eb"/>
  <!-- Book icon (white) -->
  <g transform="translate(80, 72)">
    <path d="M176 62A130 130 0 0 0 88 35c-16 0-31 3-44 8v208A130 130 0 0 1 88 244c34 0 65 13 88 34m0-216a130 130 0 0 1 88-27c16 0 31 3 44 8v208a130 130 0 0 0-132 9m0-217v217"
      fill="none" stroke="white" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Wifi crossed out badge -->
  <circle cx="392" cy="392" r="80" fill="#1e40af"/>
  <g transform="translate(352, 352)">
    <line x1="4" y1="4" x2="76" y2="76" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <path d="M22 58a30 30 0 0 1 18-7" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <line x1="40" y1="76" x2="40.2" y2="76" stroke="white" stroke-width="10" stroke-linecap="round"/>
  </g>
</svg>`.trim();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
