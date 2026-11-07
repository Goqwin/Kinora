import { Suspense } from "react";
import { SearchView } from "@/components/search/SearchView";
import { searchSampleResources } from "@/data/sample-resources";
import { DEFAULT_RADIUS_KM, RADIUS_OPTIONS_KM } from "@/lib/mapbox/config";
import { geocodeFsa } from "@/lib/mapbox/geocode";

type SearchParams = Promise<{ postal?: string; radius?: string }>;

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6">
      <h1 className="text-3xl font-bold">Find support near you</h1>
      <Suspense fallback={<p className="text-neutral-600">Loading resources…</p>}>
        <SearchResults searchParams={searchParams as SearchParams} />
      </Suspense>
    </main>
  );
}

async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const { postal = "", radius = "" } = await searchParams;
  const radiusKm = RADIUS_OPTIONS_KM.find((r) => String(r) === radius) ?? DEFAULT_RADIUS_KM;
  const userPoint = postal ? await geocodeFsa(postal) : null;
  const resources = searchSampleResources(userPoint, radiusKm);

  return (
    <>
      <form className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Postal code
          <input name="postal" defaultValue={postal} placeholder="T2E 3K8" className="rounded-lg border border-neutral-300 px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Radius
          <select name="radius" defaultValue={radiusKm} className="rounded-lg border border-neutral-300 px-3 py-2">
            {RADIUS_OPTIONS_KM.map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
        </label>
        <button className="rounded-lg bg-neutral-900 px-4 py-2 font-medium text-white">Search</button>
      </form>

      {postal && !userPoint && <p className="text-red-700">We couldn&apos;t find that postal code. Check the first three characters, e.g. T2E.</p>}
      <p className="text-sm text-neutral-600">{resources.length} resources{userPoint ? ` within ${radiusKm} km, plus province-wide programs` : ""}</p>

      <SearchView resources={resources} userPoint={userPoint} radiusKm={radiusKm} />
    </>
  );
}
