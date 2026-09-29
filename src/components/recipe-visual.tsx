import {
  Bean,
  CookingPot,
  Salad,
  Sandwich,
  Soup,
  Sprout,
  UtensilsCrossed,
  Vegan,
  Wheat,
  Cookie,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { BaseTypeKey } from "@/lib/labels";

const ICONS: Record<BaseTypeKey, LucideIcon> = {
  REIS: CookingPot,
  NUDELN: UtensilsCrossed,
  KARTOFFELN: Sprout,
  BROT: Sandwich,
  HUELSENFRUECHTE: Bean,
  HAFER: Wheat,
  BOWL: Vegan,
  SUPPE: Soup,
  SALAT: Salad,
  SONSTIGES: Cookie,
};

const TONES: Record<BaseTypeKey, string> = {
  REIS: "from-mint-100 to-mint-200 text-leaf-700",
  NUDELN: "from-butter-100 to-mint-100 text-leaf-700",
  KARTOFFELN: "from-peach-100 to-butter-100 text-peach-700",
  BROT: "from-butter-100 to-peach-100 text-peach-700",
  HUELSENFRUECHTE: "from-mint-50 to-mint-200 text-leaf-800",
  HAFER: "from-butter-100 to-mint-50 text-leaf-700",
  BOWL: "from-sky-100 to-mint-100 text-leaf-700",
  SUPPE: "from-peach-100 to-mint-100 text-peach-700",
  SALAT: "from-mint-100 to-sky-100 text-leaf-700",
  SONSTIGES: "from-mint-50 to-peach-100 text-leaf-700",
};

export function RecipeVisual({ baseType, className, iconClassName }: { baseType: BaseTypeKey; className?: string; iconClassName?: string }) {
  const Icon = ICONS[baseType];
  return (
    <div className={cn("flex items-center justify-center bg-gradient-to-br", TONES[baseType], className)} aria-hidden>
      <Icon className={cn("h-10 w-10", iconClassName)} strokeWidth={1.6} />
    </div>
  );
}
