const HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export function isValidHex(value: string | null | undefined): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

function normalizeHex(hex: string): string {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length === 3) {
    return raw
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return raw;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** WCAG contrast ratio between two colors, 1 (no contrast) to 21 (max contrast). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

const WCAG_AA_NORMAL_TEXT = 4.5;
const FALLBACK_DARK_TEXT = "#1a1a1a";

/**
 * Picks black or white as the readable text color for a given background,
 * whichever clears WCAG AA (4.5:1) by the larger margin. If neither clears
 * AA (rare mid-gray hexes), falls back to a fixed dark-neutral rather than
 * silently shipping low-contrast text - callers should log this case.
 */
export function pickReadableTextColor(backgroundHex: string): {
  color: string;
  ratio: number;
  meetsAA: boolean;
} {
  const whiteRatio = contrastRatio(backgroundHex, "#ffffff");
  const blackRatio = contrastRatio(backgroundHex, "#000000");

  if (whiteRatio >= WCAG_AA_NORMAL_TEXT || blackRatio >= WCAG_AA_NORMAL_TEXT) {
    const useWhite = whiteRatio >= blackRatio;
    return {
      color: useWhite ? "#ffffff" : "#000000",
      ratio: useWhite ? whiteRatio : blackRatio,
      meetsAA: true,
    };
  }

  return {
    color: FALLBACK_DARK_TEXT,
    ratio: Math.max(whiteRatio, blackRatio),
    meetsAA: false,
  };
}
