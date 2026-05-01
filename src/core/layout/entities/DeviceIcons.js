/**
 * DeviceIcons.js
 *
 * Single source of truth for all device and furniture SVG icons used
 * across the 2D Logical canvas.
 *
 * Previously this map was duplicated verbatim in both LogicalLayout.js
 * and Device.js (UI). It is now defined once here and imported wherever needed.
 *
 * Usage:
 *   import { resolveDeviceIconKey, buildDeviceIconImages } from './DeviceIcons.js';
 *
 *   // Build an Image map once (e.g. in a constructor):
 *   this.deviceIcons = buildDeviceIconImages();
 *
 *   // Resolve the right key for a given device's data:
 *   const iconKey = resolveDeviceIconKey(deviceData);
 *   const img = this.deviceIcons[iconKey];
 */

// ---------------------------------------------------------------------------
// SVG DEFINITIONS
// Each value is a raw SVG string. Keys are stable icon identifiers.
// ---------------------------------------------------------------------------
export const DEVICE_ICON_SVGS = {
  router: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="20" height="8" x="2" y="14" rx="2"/>
    <path d="M6.01 18h.01"/><path d="M10.01 18h.01"/>
    <path d="M15 10v4"/>
    <path d="M17.84 7.17a4 4 0 0 0-5.66 0"/>
    <path d="M20.66 4.34a8 8 0 0 0-11.31 0"/>
  </svg>`,

  switch: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6" y2="6"/>
    <line x1="6" y1="18" x2="6" y2="18"/>
  </svg>`,

  server: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
    <line x1="6" x2="6.01" y1="6" y2="6"/>
    <line x1="6" x2="6.01" y1="18" y2="18"/>
  </svg>`,

  pc: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2"/>
    <line x1="8" x2="16" y1="21" y2="21"/>
    <line x1="12" x2="12" y1="17" y2="21"/>
  </svg>`,

  firewall: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <rect width="20" height="14" x="2" y="6" rx="2"/>
  </svg>`,

  imported: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 16V4"/>
    <path d="m7 11 5 5 5-5"/>
    <rect x="3" y="18" width="18" height="3" rx="1"/>
  </svg>`,

  // Furniture icons
  desk: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
    <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/>
    <path d="M5 18v2"/><path d="M19 18v2"/>
  </svg>`,

  chair: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/>
    <path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/>
    <path d="M5 18v2"/><path d="M19 18v2"/>
  </svg>`,
};

// ---------------------------------------------------------------------------
// ICON KEY RESOLUTION
// Given a device data object, return the best matching icon key.
// The raw type string is built from all available descriptive fields so that
// catalog IDs ("2960", "1941") and display names both match correctly.
// ---------------------------------------------------------------------------

/**
 * @param {object} deviceData  - Any object with type, name, label, catalogId, modelId, iconHint
 * @returns {string}           - Key into DEVICE_ICON_SVGS
 */
export function resolveDeviceIconKey(deviceData) {
  const raw = [
    deviceData.iconHint,
    deviceData.type,
    deviceData.name,
    deviceData.label,
    deviceData.catalogId,
    deviceData.modelId,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (raw.includes('router') || raw.includes('gateway') || raw.includes('1941')) {
    return 'router';
  }
  if (raw.includes('switch') || raw.includes('catalyst') || raw.includes('2960') || raw.includes('9200')) {
    return 'switch';
  }
  if (raw.includes('wifi') || raw.includes('wireless') || raw.includes('ap')) {
    return 'router'; // WAP uses router icon
  }
  if (raw.includes('server')) {
    return 'server';
  }
  if (raw.includes('firewall') || raw.includes('asa')) {
    return 'firewall';
  }
  if (
    raw.includes('pc') ||
    raw.includes('desktop') ||
    raw.includes('computer') ||
    raw.includes('laptop') ||
    raw.includes('phone')
  ) {
    return 'pc';
  }
  if (raw.includes('desk') || raw.includes('table')) {
    return 'desk';
  }
  if (raw.includes('chair') || raw.includes('seat')) {
    return 'chair';
  }

  return 'imported';
}

// ---------------------------------------------------------------------------
// IMAGE MAP BUILDER
// Call once during construction. Returns a { key → HTMLImageElement } map.
// Safe to call in both browser and SSR contexts (guards against missing Image).
// ---------------------------------------------------------------------------

/**
 * Build a map of icon key → HTMLImageElement from the SVG definitions.
 * @returns {Record<string, HTMLImageElement>}
 */
export function buildDeviceIconImages() {
  const icons = {};

  for (const [key, svg] of Object.entries(DEVICE_ICON_SVGS)) {
    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      icons[key] = img;
    }
  }

  return icons;
}