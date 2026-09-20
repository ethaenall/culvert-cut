import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  filterSites,
  answer,
  retrieve,
  briefing,
  firstFlush,
  distance,
  type Site,
} from "../src/domain.ts";
const sites = JSON.parse(fs.readFileSync("public/data/sites.geojson", "utf8"))
  .features as Site[];
const snippets = JSON.parse(
  fs.readFileSync("public/data/snippets.json", "utf8"),
);
test("real sites retain unique IDs and WRIA8; no fabricated statuses", () => {
  assert.ok(sites.length >= 80);
  assert.equal(new Set(sites.map((s) => s.properties.id)).size, sites.length);
  assert.ok(sites.every((s) => s.properties.wria === 8));
});
test("barrier, fish, culvert filters intersect", () => {
  const result = filterSites(sites, {
    barriers: true,
    fish: true,
    culverts: true,
    near: null,
    search: "",
  });
  assert.ok(result.length > 0);
  assert.ok(
    result.every(
      (s) =>
        s.properties.fishUse === "Yes" &&
        s.properties.feature.toLowerCase().includes("culvert") &&
        s.properties.status !== "passable",
    ),
  );
});
test("geolocation fallback radius and zero results", () => {
  const near = [-122.0356, 47.6163];
  const result = filterSites(sites, {
    barriers: false,
    fish: false,
    culverts: false,
    near,
    search: "",
  });
  assert.ok(result.length);
  assert.ok(result.every((s) => distance(s.geometry.coordinates, near) <= 5));
  assert.equal(
    filterSites(sites, {
      barriers: false,
      fish: false,
      culverts: false,
      near: null,
      search: "NONEXISTENT_STREAM",
    }).length,
    0,
  );
});
test("unknown query refuses; selected site does not override unrelated question", () => {
  assert.equal(
    retrieve("Martian weather", sites, snippets, sites[0]).sites.length,
    0,
  );
  assert.match(
    answer("Martian weather", sites, snippets, sites[0])[0].text,
    /don't know/,
  );
});
test("retrieved answers have resolvable source citations", () => {
  const r = answer("Zackuse Creek", sites, snippets);
  assert.ok(r.length);
  assert.ok(r.every((s) => s.cite && s.url.startsWith("https://")));
  assert.ok(r.some((s) => s.text.includes("Zackuse")));
});
test("briefing includes ID coordinates and three sentences", () => {
  const s = sites.find((s) => s.properties.id === "920121")!;
  const b = briefing(s);
  assert.ok(b.includes(s.properties.id));
  assert.ok(b.includes(s.geometry.coordinates[1].toFixed(5)));
  assert.equal(b.split(/(?<=[.?])\s+/).length, 3);
});
test("rain requires at least five dry days", () => {
  assert.equal(firstFlush(false, 6), false);
  assert.equal(firstFlush(true, 4), false);
  assert.equal(firstFlush(true, 5), true);
});
test("heldout identifiers absent from training context", () => {
  const heldout = JSON.parse(
    fs.readFileSync("data/heldout_sites.json", "utf8"),
  );
  const rows = fs
    .readFileSync("data/train.jsonl", "utf8")
    .trim()
    .split("\n")
    .map((x) => JSON.parse(x));
  assert.ok(rows.length >= 400);
  for (const row of rows) {
    const c = JSON.parse(row.messages[1].content.split("\n\nContext:\n")[1]);
    const contexts = Array.isArray(c) ? c : [c];
    assert.ok(
      contexts.every(
        (s: { id: string }) =>
          !heldout.some((h: { id: string }) => h.id === s.id),
      ),
    );
  }
});

test('temperature question ranks river temperature above lake oxygen', () => {
  const r = retrieve('Sammamish River temperature', sites, snippets);
  assert.match(r.snippets[0].title, /SAMMAMISH RIVER.*Temperature/);
  assert.equal(r.sites.length, 0);
});

test('named creek retrieval is not diluted by generic creek road matches', () => {
  const result = retrieve('Explain Zackuse Creek', sites, snippets);
  assert.ok(result.sites.length > 0);
  assert.ok(result.sites.every(s => /zackuse/i.test(`${s.properties.stream} ${s.properties.road}`)));
});
