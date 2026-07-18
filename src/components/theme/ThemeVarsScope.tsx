import type { CSSProperties } from "react";
import { clubThemeToCssVars, type ClubTheme } from "@/lib/theme/palette";

export function ThemeVarsScope({
  theme,
  children,
}: {
  theme: ClubTheme;
  children: React.ReactNode;
}) {
  const style = clubThemeToCssVars(theme) as CSSProperties;
  return (
    <div style={style} className="contents">
      {children}
    </div>
  );
}
