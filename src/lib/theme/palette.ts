import { DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR } from "@/config/theme-defaults";
import { isValidHex, pickReadableTextColor } from "@/lib/theme/contrast";

export interface ClubTheme {
  primary: string;
  primaryContrast: string;
  secondary: string;
  secondaryContrast: string;
}

/**
 * Resolves raw hex strings (possibly null/invalid, straight from
 * fc26_club_colors) into a validated theme, falling back to the documented
 * defaults when the value is missing or malformed.
 */
export function resolveClubTheme(
  primaryHexRaw: string | null | undefined,
  secondaryHexRaw: string | null | undefined,
): ClubTheme {
  const primary = isValidHex(primaryHexRaw) ? primaryHexRaw : DEFAULT_PRIMARY_COLOR;
  const secondary = isValidHex(secondaryHexRaw) ? secondaryHexRaw : DEFAULT_SECONDARY_COLOR;

  return {
    primary,
    primaryContrast: pickReadableTextColor(primary).color,
    secondary,
    secondaryContrast: pickReadableTextColor(secondary).color,
  };
}

/** CSS custom properties for the theme, to be set via a React style prop. */
export function clubThemeToCssVars(theme: ClubTheme): Record<string, string> {
  return {
    "--club-primary": theme.primary,
    "--club-primary-contrast": theme.primaryContrast,
    "--club-primary-soft": `color-mix(in srgb, ${theme.primary} 12%, white)`,
    "--club-primary-border": `color-mix(in srgb, ${theme.primary} 35%, white)`,
    "--club-secondary": theme.secondary,
    "--club-secondary-contrast": theme.secondaryContrast,
    "--club-chart-1": theme.primary,
    "--club-chart-2": theme.secondary,
  };
}
