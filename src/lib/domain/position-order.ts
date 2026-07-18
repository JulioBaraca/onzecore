/** Tactical order (defense to attack), not alphabetical - matches how the game groups positions. */
const POSITION_ORDER = ["GOL", "LD", "ZAG", "LE", "VOL", "MD", "MC", "ME", "MEI", "PE", "PD", "ATA"];

export function positionSortIndex(position: string | null | undefined): number {
  if (!position) return POSITION_ORDER.length;
  const idx = POSITION_ORDER.indexOf(position.trim().toUpperCase());
  return idx === -1 ? POSITION_ORDER.length : idx;
}
