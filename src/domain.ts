import type { Feature, Point, FeatureCollection, Geometry } from "geojson";
export type SiteProps = {
  id: string;
  status: string;
  stream: string;
  feature: string;
  fishUse: string;
  owner: string;
  access: string;
  impairment: string;
  source: string;
  official: string;
  wria: number;
  road: string;
  survey: string;
  PotentialSpecies?: string;
  BarrierCorrectionYearsText?: string;
  [key: string]: unknown;
};
export type Site = Feature<Point, SiteProps>;
export type Collection = FeatureCollection<Geometry>;
export type Snippet = {
  id: string;
  title: string;
  text: string;
  url: string;
  keywords: string[];
};
export type Sentence = { text: string; cite: string; url: string };
export function distance(a: number[], b: number[]) {
  const rad = Math.PI / 180;
  const dlat = (b[1] - a[1]) * rad,
    dlon = (b[0] - a[0]) * rad;
  return (
    6371 *
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin(dlat / 2) ** 2 +
          Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dlon / 2) ** 2,
      ),
    )
  );
}
export function filterSites(
  sites: Site[],
  f: {
    barriers: boolean;
    fish: boolean;
    culverts: boolean;
    near: number[] | null;
    search: string;
  },
) {
  return sites.filter((s) => {
    const p = s.properties;
    return (
      (!f.barriers ||
        ["total", "partial"].includes(p.status) ||
        p.FishPassageBarrierStatusCode === 10) &&
      (!f.fish || p.fishUse === "Yes") &&
      (!f.culverts || p.feature.toLowerCase().includes("culvert")) &&
      (!f.near || distance(s.geometry.coordinates, f.near) <= 5) &&
      (!f.search ||
        `${p.id} ${p.stream} ${p.road}`
          .toLowerCase()
          .includes(f.search.toLowerCase()))
    );
  });
}
export function briefing(s: Site) {
  const p = s.properties,
    [lon, lat] = s.geometry.coordinates;
  return `Please review fish-passage Site ${p.id} at ${lat.toFixed(5)}, ${lon.toFixed(5)} on ${p.stream}. The bundled WDFW record lists ${p.status} passage status and ${p.feature.toLowerCase()} feature type. Could public works confirm the current condition, responsible owner, and next assessment or restoration step?`;
}
export function retrieve(
  q: string,
  sites: Site[],
  snippets: Snippet[],
  selected?: Site | null,
) {
  const words = q.toLowerCase().split(/[^a-z0-9]+/);
  const stop = new Set([
    "what",
    "this",
    "that",
    "the",
    "is",
    "a",
    "on",
    "in",
    "can",
    "you",
    "tell",
    "me",
    "about",
    "it",
    "and",
    "for",
    "of",
    "does",
    "why",
    "site",
  ]);
  const terms = words.filter((w) => !stop.has(w));
  let ranked = sites
    .map((s) => ({
      s,
      score: terms.reduce(
        (n, w) =>
          n +
          (`${s.properties.id} ${s.properties.stream} ${s.properties.road}`
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .includes(w)
            ? 1
            : 0),
        0,
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.s);
  const docs = snippets
    .map((s) => ({
      s,
      score: s.keywords.filter((k) => q.toLowerCase().includes(k)).length,
    }))
    .filter((x) => x.score)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.s);
  // Basin-wide environmental questions should not pull in unrelated road-name matches.
  if (docs.length && /temperature|oxygen|6ppd|rain|flush|riparian|303|impaired/i.test(q)) {
    ranked = ranked.filter((s) => words.includes(s.properties.id.toLowerCase()));
  }
  if (
    selected &&
    /\b(this|selected)\b/i.test(q) &&
    /\b(site|crossing|barrier|stream)\b/i.test(q) &&
    !ranked.some((s) => s.properties.id === selected.properties.id)
  )
    ranked.unshift(selected);
  return { sites: ranked.slice(0, 3), snippets: docs };
}
export function answer(
  q: string,
  sites: Site[],
  snippets: Snippet[],
  selected?: Site | null,
): Sentence[] {
  const r = retrieve(q, sites, snippets, selected);
  if (!r.sites.length && !r.snippets.length)
    return [
      {
        text: "I don't know: no matching official record was retrieved; check WDFW's inventory or search a Site ID or stream name.",
        cite: "WDFW inventory",
        url: "https://wdfw.wa.gov/species-habitats/habitat-recovery/fish-passage/assessment",
      },
    ];
  const result: Sentence[] = r.snippets.map((s) => ({
    text: s.text,
    cite: s.id,
    url: s.url,
  }));
  for (const s of r.sites) {
    const p = s.properties;
    if (/owner|own|responsible/i.test(q))
      result.push({
        text: `Site ${p.id} records owner type ${p.owner}; a named responsible agency is not established by that field.`,
        cite: p.id,
        url: p.official,
      });
    else if (/above|reach|access|kokanee|coho/i.test(q))
      result.push({
        text: `Site ${p.id} is ${p.status} on ${p.stream}; upstream connectivity and species-specific access are not verified by this site record.`,
        cite: p.id,
        url: p.official,
      });
    else
      result.push({
        text: `Site ${p.id} on ${p.stream} is recorded as ${p.status}; feature: ${p.feature}; fish use: ${p.fishUse}.`,
        cite: p.id,
        url: p.official,
      });
  }
  return result;
}
export function firstFlush(rain: boolean, dryDays: number) {
  return rain && dryDays >= 5;
}
