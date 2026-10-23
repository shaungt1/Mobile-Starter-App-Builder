/** Tab-bar entries shared by every layout and both frontends. */
import { Compass, House, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: House },
  { to: "/explore", label: "Explore", Icon: Compass },
  { to: "/settings", label: "Settings", Icon: Settings },
] as const;
