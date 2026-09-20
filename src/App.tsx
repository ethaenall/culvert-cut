import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Droplets,
  Fish,
  Layers,
  LocateFixed,
  MapPin,
  Search,
  Upload,
  X,
  Waves,
} from "lucide-react";
import BasinMap from "./Map";
import {
  answer,
  briefing,
  filterSites,
  firstFlush,
  retrieve,
  type Site,
  type Collection,
  type Snippet,
  type Sentence,
} from "./domain";
type Story = {
  title: string;
  description: string;
  tag: string;
  siteId: string | null;
  coordinates: number[];
  illustrative: boolean;
  compareSiteId?: string;
};
type Bundle = {
  sites: Site[];
  streams: Collection;
  coho: Collection;
  impaired: Collection;
  stories: Story[];
  snippets: Snippet[];
  manifest: { retrievedAt: string };
};
const labels: Record<string, string> = {
  total: "Total barrier",
  partial: "Partial barrier",
  passable: "Passable",
  unknown: "Unknown",
};
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="switch" />
    </label>
  );
}
export default function App() {
  const [data, setData] = useState<Bundle | null>(null),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Site | null>(null),
    [focus, setFocus] = useState<number[] | null>(null),
    [story, setStory] = useState<Story | null>(null);
  const [barriers, setBarriers] = useState(false),
    [fish, setFish] = useState(false),
    [culverts, setCulverts] = useState(false),
    [near, setNear] = useState<number[] | null>(null),
    [search, setSearch] = useState(""),
    [showCoho, setShowCoho] = useState(false),
    [showImpaired, setShowImpaired] = useState(false),
    [rain, setRain] = useState(false),
    [showFlush, setShowFlush] = useState(true),
    [tab, setTab] = useState("explore"),
    [toast, setToast] = useState(""),
    [question, setQuestion] = useState(""),
    [response, setResponse] = useState<Sentence[]>([]),
    [asking, setAsking] = useState(false),
    [localModel, setLocalModel] = useState(false),
    [modelStatus, setModelStatus] = useState("template fallback"),
    [showSources, setShowSources] = useState(false),
    [listOpen, setListOpen] = useState(false),
    [photoCount, setPhotoCount] = useState(0);
  useEffect(() => {
    const names = [
      "sites",
      "streams",
      "coho",
      "impaired",
      "stories",
      "snippets",
      "manifest",
    ];
    Promise.all(
      names.map((n) =>
        fetch(
          `${import.meta.env.BASE_URL}data/${n}.${["sites", "streams", "coho", "impaired"].includes(n) ? "geojson" : "json"}`,
        ).then((r) => {
          if (!r.ok) throw Error(n);
          return r.json();
        }),
      ),
    )
      .then(([s, streams, coho, impaired, stories, snippets, manifest]) =>
        setData({
          sites: s.features,
          streams,
          coho,
          impaired,
          stories,
          snippets,
          manifest,
        }),
      )
      .catch(() =>
        setError(
          "Bundled data could not be loaded. Reload the page or run npm run dev from the project folder.",
        ),
      );
    try {
      setPhotoCount(
        JSON.parse(localStorage.getItem("culvert-reports") || "[]").length,
      );
    } catch {
      /* private storage unavailable */
    }
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const visible = useMemo(
    () =>
      filterSites(data?.sites || [], {
        barriers,
        fish,
        culverts,
        near,
        search,
      }),
    [data, barriers, fish, culverts, near, search],
  );
  function choose(s: Site) {
    setSelected(s);
    setFocus(s.geometry.coordinates);
    setStory(null);
    setListOpen(false);
  }
  function locate() {
    if (near) {
      setNear(null);
      return;
    }
    const fallback = () => {
      setNear([-122.0356, 47.6163]);
      setFocus([-122.0356, 47.6163]);
      setToast(
        "Location unavailable. Showing 5 km around Sammamish City Hall.",
      );
    };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = [p.coords.longitude, p.coords.latitude];
        setNear(loc);
        setFocus(loc);
        setToast(
          "Showing records within 5 km. Location stays in this session.",
        );
      },
      fallback,
      { timeout: 6000 },
    );
  }
  async function ask(q = question) {
    if (!data || !q.trim()) return;
    setQuestion(q);
    setAsking(true);
    setModelStatus("template fallback");
    let result = answer(q, data.sites, data.snippets, selected);
    if (localModel) {
      try {
        const r = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q,
            context: retrieve(q, data.sites, data.snippets, selected),
          }),
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw Error();
        const body = await r.json();
        if (!Array.isArray(body.sentences)) throw Error();
        result = body.sentences;
        setModelStatus(body.mode);
      } catch {
        setToast("Local model unavailable; using grounded templates.");
      }
    }
    setResponse(result);
    setAsking(false);
  }
  async function copy() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(briefing(selected));
      setToast("Three-sentence briefing copied.");
    } catch {
      setToast("Clipboard unavailable. Select and copy the briefing below.");
    }
  }
  async function photo(file?: File) {
    if (!file || !selected) return;
    if (!file.type.startsWith("image/")) {
      setToast("Choose an image file.");
      return;
    }
    if (file.size > 1500000) {
      setToast("Choose an image smaller than 1.5 MB for local storage.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const reports = JSON.parse(
          localStorage.getItem("culvert-reports") || "[]",
        );
        reports.push({
          siteId: selected.properties.id,
          createdAt: new Date().toISOString(),
          image: reader.result,
          status: "queued locally — mock",
        });
        localStorage.setItem("culvert-reports", JSON.stringify(reports));
        setPhotoCount(reports.length);
        setToast("Photo queued on this device only. Nothing was submitted.");
      } catch {
        setToast("Local storage is unavailable or full. Photo was not saved.");
      }
    };
    reader.readAsDataURL(file);
  }
  if (error)
    return (
      <main className="loading">
        <Waves />
        <h1>Culvert Cut</h1>
        <p role="alert">{error}</p>
        <button onClick={() => location.reload()}>Retry</button>
      </main>
    );
  if (!data)
    return (
      <main className="loading">
        <Waves size={44} />
        <h1>Follow the water.</h1>
        <p>Loading the basin’s official records…</p>
      </main>
    );
  const p = selected?.properties;
  const counts = {
    total: visible.filter((s) => s.properties.status === "total").length,
    partial: visible.filter((s) => s.properties.status === "partial").length,
  };
  return (
    <div className="app">
      <header>
        <a className="brand" href={import.meta.env.BASE_URL}>
          <span className="brand-mark">
            <Waves size={26} />
          </span>
          Culvert Cut
          <span className="brand-divider" />
          <span className="brand-sub">FOLLOW THE WATER</span>
        </a>
        <nav>
          <button
            className={tab === "explore" ? "active" : ""}
            onClick={() => setTab("explore")}
          >
            Explore the basin
          </button>
          <button
            className={tab === "ask" ? "active" : ""}
            onClick={() => setTab("ask")}
          >
            Ask this basin <ArrowUpRight size={14} />
          </button>
        </nav>
        <span className="live-dot">BUNDLED OFFICIAL DATA</span>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="eyebrow">
            <span className="tiny-line" /> WRIA 08 · WASHINGTON
          </div>
          <h1>
            Small crossings.
            <br />
            <span>Big consequences.</span>
          </h1>
          <p className="intro">
            Trace the barriers between our streets and salmon habitat.
          </p>
          <div className="basin-label">
            <MapPin size={15} />
            <span>Lake Washington · Cedar · Sammamish</span>
          </div>
          <div className="tabs">
            <button
              className={tab === "explore" ? "active" : ""}
              onClick={() => setTab("explore")}
            >
              Explore
            </button>
            <button
              className={tab === "ask" ? "active" : ""}
              onClick={() => setTab("ask")}
            >
              Ask this basin <span>↗</span>
            </button>
          </div>
          {tab === "explore" ? (
            <>
              <label className="search">
                <Search size={17} />
                <input
                  aria-label="Search stream or Site ID"
                  placeholder="Stream, crossing, or site ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
              <div className="section-label">NARROW YOUR SEARCH</div>
              <Toggle
                label="Barriers only"
                checked={barriers}
                onChange={() => setBarriers(!barriers)}
              />
              <Toggle
                label="Fish use recorded"
                checked={fish}
                onChange={() => setFish(!fish)}
              />
              <Toggle
                label="Culverts only"
                checked={culverts}
                onChange={() => setCulverts(!culverts)}
              />
              <button
                className={`near-button ${near ? "chosen" : ""}`}
                onClick={locate}
              >
                <LocateFixed size={15} />
                {near ? "Within 5 km · clear" : "Find crossings near me"}
                <ArrowUpRight size={14} />
              </button>
              <div className="section-label with-icon">
                <Layers size={14} /> SEE THE WHOLE STREAM
              </div>
              <Toggle
                label="Coho potential / access"
                checked={showCoho}
                onChange={() => setShowCoho(!showCoho)}
              />
              <Toggle
                label="303(d) impaired waters"
                checked={showImpaired}
                onChange={() => setShowImpaired(!showImpaired)}
              />
              {showCoho && (
                <p className="layer-note">
                  Access: <i className="accessible" /> accessible ·{" "}
                  <i className="partial" /> partial · <i className="total" />{" "}
                  inaccessible · gray: unknown / no potential habitat. Thicker lines indicate higher coho potential. Most access values in this snapshot are missing or unrecognized; potential is not observed fish presence.
                </p>
              )}
              {showImpaired && (
                <p className="layer-note purple">
                  Ecology assessment areas · all listed parameters. Click a
                  story or ask about temperature / dissolved oxygen.
                </p>
              )}
              <Toggle
                label="First-flush advisory"
                checked={showFlush}
                onChange={() => setShowFlush(!showFlush)}
              />
              <div className="stories-heading">
                <span className="section-label">FIELD NOTES</span>
                <span>12 places to start</span>
              </div>
              <div className="story-list">
                {data.stories.map((s, i) => (
                  <button
                    key={s.title}
                    className="story-row"
                    onClick={() => {
                      setStory(s);
                      setSelected(
                        s.siteId
                          ? data.sites.find(
                              (x) => x.properties.id === s.siteId,
                            ) || null
                          : null,
                      );
                      setFocus(s.coordinates);
                      if (s.tag === "Water quality") setShowImpaired(true);
                    }}
                  >
                    <span className="story-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{s.title}</strong>
                      <small>{s.tag}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="ask-panel">
              <div className="model-badge">
                <span /> {modelStatus}
              </div>
              <h2>
                A small specialist.
                <br />A traceable answer.
              </h2>
              <p>
                Ask about a stream, a Site ID, or what an official record means.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask();
                }}
              >
                <textarea
                  aria-label="Ask this basin"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What do we know about Zackuse Creek?"
                  maxLength={1500}
                />
                <button
                  className="primary"
                  disabled={asking || !question.trim()}
                >
                  {asking ? "Retrieving…" : "Ask the basin"}
                  <ArrowRight size={17} />
                </button>
              </form>
              <div className="suggestions">
                {[
                  "Explain Zackuse Creek",
                  "Sammamish River temperature",
                  "What is first flush?",
                ].map((q) => (
                  <button key={q} onClick={() => ask(q)}>
                    {q}
                    <ArrowUpRight size={12} />
                  </button>
                ))}
              </div>
              <div className="answer" aria-live="polite">
                {response.map((r, i) => (
                  <p key={i}>
                    {r.text}{" "}
                    <a
                      className="citation"
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.cite} ↗
                    </a>
                  </p>
                ))}
              </div>
              <Toggle
                label="Use optional local model"
                checked={localModel}
                onChange={() => setLocalModel(!localModel)}
              />
              <p className="layer-note">
                No external LLM APIs. Each answer uses retrieved records.
                Missing evidence stays unknown.
              </p>
            </div>
          )}
          <footer>
            <span className="footer-logo">
              <Fish size={16} /> EARTH FORWARD / 2026
            </span>
            <button onClick={() => setShowSources(true)}>
              Sources & limitations <ArrowUpRight size={12} />
            </button>
          </footer>
        </aside>
        <main className="map-area">
          <BasinMap
            sites={visible}
            streams={data.streams}
            coho={data.coho}
            impaired={data.impaired}
            showCoho={showCoho}
            showImpaired={showImpaired}
            selected={selected}
            onSelect={choose}
            focus={focus}
          />
          <div className="map-top">
            <div className="map-title">
              <span className="eyebrow">ONE BASIN. CONNECTED PRESSURES.</span>
              <span>
                Passage <span className="muted">/</span> Habitat{" "}
                <span className="muted">/</span> Water quality
              </span>
            </div>
            <button
              className={`demo-button ${rain ? "chosen" : ""}`}
              onClick={() => setRain(!rain)}
            >
              <Droplets size={15} /> Demo rain <span className="demo-light" />
            </button>
          </div>
          {showFlush && firstFlush(rain, 6) && (
            <div className="flush-banner">
              <Droplets size={21} />
              <div>
                <strong>First-flush window</strong>
                <p>Don’t wash the car into the storm drain.</p>
                <small>
                  DEMO HEURISTIC · rain next 24h + 6 canned dry days · no
                  chemistry sensor
                </small>
              </div>
            </div>
          )}
          <div className="map-bottom">
            <div className="summary-card">
              <div className="summary-head">
                <span className="eyebrow">THE INVENTORY · CURRENT FILTERS</span>
                <button onClick={() => setListOpen(!listOpen)}>
                  Browse records <ChevronDown size={13} />
                </button>
              </div>
              <div className="stats">
                <div>
                  <b>{visible.length.toLocaleString()}</b>
                  <span>crossings in filters</span>
                </div>
                <div>
                  <b className="coral">{counts.total}</b>
                  <span>total barriers</span>
                </div>
                <div>
                  <b className="sand">{counts.partial}</b>
                  <span>partial barriers</span>
                </div>
              </div>
              <div className="legend">
                {Object.keys(labels).map((k) => (
                  <span key={k}>
                    <i className={`symbol ${k}`} />
                    {labels[k]}
                  </span>
                ))}
              </div>
              <p className="inventory-note">
                An incomplete inventory. Unknown never means passable.
              </p>
            </div>
            <div className="map-scale-label">
              47.62° N &nbsp; 122.04° W<br />
              <span>LAKE SAMMAMISH BASIN</span>
            </div>
          </div>
          {listOpen && (
            <section className="records-panel">
              <div className="drawer-top">
                <h2>Crossing records</h2>
                <button
                  aria-label="Close crossing list"
                  onClick={() => setListOpen(false)}
                >
                  <X />
                </button>
              </div>
              <p>
                {visible.length} matching records. Use the stream / ID search to
                narrow.
              </p>
              {visible.length === 0 ? (
                <p>No sites match these filters.</p>
              ) : (
                visible.slice(0, 150).map((s) => (
                  <button
                    className="record-row"
                    key={s.properties.id}
                    onClick={() => choose(s)}
                  >
                    <i className={`symbol ${s.properties.status}`} />
                    <span>
                      {s.properties.stream}
                      <small>
                        {s.properties.id} · {s.properties.road}
                      </small>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                ))
              )}
              {visible.length > 150 && (
                <p>
                  Showing the first 150; search to locate any bundled record.
                </p>
              )}
            </section>
          )}
          {(selected || story) && (
            <section className="drawer" aria-label="Crossing details">
              <div className="drawer-top">
                <span className="eyebrow">
                  {story ? "FIELD NOTE" : "OFFICIAL INVENTORY RECORD"}
                </span>
                <button
                  aria-label="Close details"
                  onClick={() => {
                    setSelected(null);
                    setStory(null);
                  }}
                >
                  <X size={19} />
                </button>
              </div>
              {story && (
                <div className="story-detail">
                  <span className="pill">{story.tag}</span>
                  <h2>{story.title}</h2>
                  <p>{story.description}</p>
                  {story.illustrative && (
                    <small>
                      Illustrative pin pending live join · approximate viewing
                      context.
                    </small>
                  )}
                  {story.compareSiteId && (
                    <button
                      className="outline"
                      onClick={() =>
                        choose(
                          data.sites.find(
                            (s) => s.properties.id === story.compareSiteId,
                          )!,
                        )
                      }
                    >
                      Compare City-owned crossing <ArrowRight size={15} />
                    </button>
                  )}
                </div>
              )}
              {p && selected && (
                <>
                  <span className={`status-pill ${p.status}`}>
                    <i className={`symbol ${p.status}`} />
                    {labels[p.status]}
                  </span>
                  <h2>{p.stream}</h2>
                  <p className="road">{p.road}</p>
                  <div className="site-id">
                    SITE {p.id}
                    <span>
                      {selected.geometry.coordinates[1].toFixed(5)},{" "}
                      {selected.geometry.coordinates[0].toFixed(5)}
                    </span>
                  </div>
                  <dl>
                    {[
                      ["Feature type", p.feature],
                      ["WRIA", `${p.wria} · Lake Washington`],
                      ["Fish use", p.fishUse],
                      ["Fish observed", "Not supplied"],
                      ["Potential species", p.PotentialSpecies || "Unknown"],
                      ["Access above", p.access],
                      ["303(d) at this site", p.impairment],
                      ["Piped length", "Not supplied"],
                      ["Owner type", p.owner],
                      ["Survey date", p.survey || "Unknown"],
                      [
                        "Correction years",
                        p.BarrierCorrectionYearsText || "Not supplied",
                      ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="detail-note">
                    <Fish size={19} />
                    <p>
                      A passage record is one piece of the stream. Habitat above
                      this crossing needs a verified network assessment.
                    </p>
                  </div>
                  <button className="primary" onClick={copy}>
                    <Copy size={16} />
                    Copy public works briefing
                  </button>
                  <details>
                    <summary>Preview the 3-sentence briefing</summary>
                    <p className="briefing">{briefing(selected)}</p>
                  </details>
                  <a
                    className="outline"
                    href={p.official}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open official record <ArrowUpRight size={16} />
                  </a>
                  <label className="upload">
                    <Upload size={16} /> Queue a photo report
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        photo(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <small className="mock-note">
                    MOCK · {photoCount} queued locally · never submitted
                  </small>
                  {photoCount > 0 && (
                    <button
                      className="text-button"
                      onClick={() => {
                        localStorage.removeItem("culvert-reports");
                        setPhotoCount(0);
                        setToast("Local photo queue cleared.");
                      }}
                    >
                      Clear local queue
                    </button>
                  )}
                </>
              )}
              {!p && (
                <button
                  className="primary"
                  onClick={() => {
                    setTab("ask");
                    ask(
                      story?.tag === "Water quality"
                        ? "Sammamish River temperature"
                        : story?.title || "",
                    );
                  }}
                >
                  Explore the source context <ArrowRight size={16} />
                </button>
              )}
            </section>
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {showSources && (
        <div className="modal-backdrop" onClick={() => setShowSources(false)}>
          <section
            className="source-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Sources and limitations"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-top">
              <h2>Evidence, with its edges.</h2>
              <button
                aria-label="Close sources"
                onClick={() => setShowSources(false)}
              >
                <X />
              </button>
            </div>
            <p>
              Official snapshots retrieved{" "}
              {new Date(data.manifest.retrievedAt).toLocaleDateString()}. Site
              records are filtered to WRIA 8; overlays use the Eastside bounding
              box and may extend outside the basin.
            </p>
            <p>
              Inventories can be incomplete or outdated. Coho intrinsic
              potential is modeled habitat, not a fish observation. No verified
              upstream-network or site-to-303(d) join is claimed. Photo reports
              and weather are local demonstrations.
            </p>
            <div className="riparian">
              <b>
                28.6 <span>/ 69 acres</span>
              </b>
              <div>
                <i />
              </div>
              <p>Sammamish River riparian planting · 41% of 2025 goal</p>
            </div>
            {data.snippets.filter((s) => !s.id.startsWith("303(d)")).map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                {s.id}
                <ArrowUpRight size={14} />
              </a>
            ))}
            <a
              href="https://www5.kingcounty.gov/sdc?Layer=fp_cohointrinsicpotential_line"
              target="_blank"
              rel="noreferrer"
            >
              King County coho intrinsic potential ↗
            </a>
            <a
              href="https://www5.kingcounty.gov/sdc?Layer=wtrcrs_line"
              target="_blank"
              rel="noreferrer"
            >
              King County streams ↗
            </a>
            <a
              href="https://www5.kingcounty.gov/sdc?Layer=fp_fishpassagesites_point"
              target="_blank"
              rel="noreferrer"
            >
              King County fish passage sites ↗
            </a>
            <a
              href="https://ecology.wa.gov/water-shorelines/water-quality/water-improvement/assessment-303d-list"
              target="_blank"
              rel="noreferrer"
            >
              Ecology Water Quality Assessment / 303(d) ↗
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
