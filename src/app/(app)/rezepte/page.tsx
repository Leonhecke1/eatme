import type { Metadata } from "next";
import { Search, SearchX } from "lucide-react";
import { CollapsibleFilters } from "@/components/collapsible-filters";
import { RecipeCard } from "@/components/recipe-card";
import { ButtonLink } from "@/components/ui/button";
import { ChipLink } from "@/components/ui/chip";
import { Input } from "@/components/ui/form";
import { EmptyState, PageHeader } from "@/components/ui/page";
import { BASE_LABELS, BASE_TYPES, MEAL_LABELS, MEAL_TYPES, TAG_LABELS } from "@/lib/labels";
import { requireProfileUser } from "@/server/auth";
import { loadUserContext } from "@/server/context";
import { listRecipes, type RecipeFilters } from "@/server/recipes";

export const metadata: Metadata = { title: "Rezepte" };

type Params = Record<string, string | undefined>;

function hrefWith(params: Params, key: string, value: string | undefined) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, [key]: value })) if (v) next.set(k, v);
  const s = next.toString();
  return s ? `/rezepte?${s}` : "/rezepte";
}

export default async function RecipesPage({ searchParams }: PageProps<"/rezepte">) {
  const user = await requireProfileUser();
  const raw = await searchParams;
  const params: Params = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const filters: RecipeFilters = {
    q: params.q?.slice(0, 80) || undefined,
    basis: BASE_TYPES.includes(params.basis as never) ? params.basis : undefined,
    mahlzeit: MEAL_TYPES.includes(params.mahlzeit as never) ? params.mahlzeit : undefined,
    zeit: params.zeit ? Number(params.zeit) || undefined : undefined,
    tag: params.tag && params.tag in TAG_LABELS ? params.tag : undefined,
  };
  const ctx = await loadUserContext(user.id);
  const recipes = await listRecipes(user.id, ctx, filters);
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader title="Rezepte" subtitle={`${recipes.length} vegane Rezepte${hasFilters ? " passend zu deinen Filtern" : ""}`} />

      <form action="/rezepte" className="relative mb-4">
        {Object.entries(params)
          .filter(([k, v]) => k !== "q" && v)
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input name="q" defaultValue={filters.q} placeholder="Rezept suchen, z. B. Curry" className="pl-10" aria-label="Rezept suchen" />
      </form>

      <CollapsibleFilters activeCount={[filters.basis, filters.mahlzeit, filters.zeit, filters.tag].filter(Boolean).length}>
        <FilterRow label="Beilage">
          <ChipLink href={hrefWith(params, "basis", undefined)} active={!filters.basis}>
            Alle
          </ChipLink>
          {BASE_TYPES.map((b) => (
            <ChipLink key={b} href={hrefWith(params, "basis", filters.basis === b ? undefined : b)} active={filters.basis === b}>
              {BASE_LABELS[b]}
            </ChipLink>
          ))}
        </FilterRow>
        <FilterRow label="Mahlzeit">
          {MEAL_TYPES.map((m) => (
            <ChipLink key={m} href={hrefWith(params, "mahlzeit", filters.mahlzeit === m ? undefined : m)} active={filters.mahlzeit === m}>
              {MEAL_LABELS[m]}
            </ChipLink>
          ))}
          {[15, 30].map((z) => (
            <ChipLink key={z} href={hrefWith(params, "zeit", filters.zeit === z ? undefined : String(z))} active={filters.zeit === z}>
              bis {z} Min.
            </ChipLink>
          ))}
          {Object.entries(TAG_LABELS).map(([t, label]) => (
            <ChipLink key={t} href={hrefWith(params, "tag", filters.tag === t ? undefined : t)} active={filters.tag === t}>
              {label}
            </ChipLink>
          ))}
        </FilterRow>
      </CollapsibleFilters>

      <div className="mt-6">
        {recipes.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Keine Rezepte gefunden"
            text="Probier es mit weniger Filtern oder einem anderen Suchbegriff."
            action={
              <ButtonLink href="/rezepte" variant="soft">
                Filter zurücksetzen
              </ButtonLink>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} userAllergies={ctx.profile.allergies} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {children}
    </div>
  );
}
