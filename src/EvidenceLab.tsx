import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FlaskConical,
  MapPin,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import type { Site } from "./domain";
import "./evidence.css";
type Verdict = "supported" | "contradicted" | "insufficient";
type Audit = { verdict: Verdict; reason: string; citations: string[] };
type Run = {
  raw: string;
  parsed: Audit | null;
  seconds: number;
  correctVerdict: boolean;
  validCitations: boolean;
  passed: boolean;
};
type EvidenceCase = {
  id: string;
  kind: string;
  claim: string;
  expected: Audit;
  evidenceFields: string[];
  site: Record<string, any>;
  base: Run;
  adapter: Run;
};
type Score = {
  total: number;
  correctVerdicts: number;
  validCitations: number;
  passed: number;
  meanSeconds: number;
};
type Evaluation = {
  model: string;
  trainedAt: string;
  method: string;
  dataset: { trainPairs: number; testSites: number; testCases: number };
  base: Score;
  adapter: Score;
  cases: EvidenceCase[];
};
const names: Record<Verdict, string> = {
  supported: "Supported",
  contradicted: "Contradicted",
  insufficient: "Not established",
};
const descriptions: Record<Verdict, string> = {
  supported: "The supplied record explicitly backs this claim.",
  contradicted: "The supplied record explicitly says something different.",
  insufficient: "The evidence does not establish this conclusion.",
};
export default function EvidenceLab({
  sites,
  onExplore,
}: {
  sites: Site[];
  onExplore: (siteId?: string) => void;
}) {
  const [data, setData] = useState<Evaluation | null>(null),
    [error, setError] = useState(""),
    [index, setIndex] = useState(2),
    [guess, setGuess] = useState<Verdict | null>(null),
    [revealed, setRevealed] = useState(false),
    [filter, setFilter] = useState("all"),
    [method, setMethod] = useState(false),
    [live, setLive] = useState(false),
    [claim, setClaim] = useState(""),
    [siteId, setSiteId] = useState("920121"),
    [liveResult, setLiveResult] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [briefCopied, setBriefCopied] = useState(false);
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/model-evaluation.json`)
      .then((r) => {
        if (!r.ok) throw Error("Recorded model evaluation is unavailable.");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  const cases = useMemo(
    () =>
      data?.cases.filter(
        (c) =>
          filter === "all" ||
          (filter === "improved" &&
            !c.base.correctVerdict &&
            c.adapter.correctVerdict) ||
          (filter === "errors" && !c.adapter.passed) ||
          c.expected.verdict === filter,
      ) || [],
    [data, filter],
  );
  const selected = cases[index % Math.max(cases.length, 1)];
  const source = live
    ? sites.find((s) => s.properties.id === siteId)?.properties
    : selected?.site;
  function move(n: number) {
    setBriefCopied(false);
    setIndex((i) => (i + n + cases.length) % cases.length);
    setGuess(null);
    setRevealed(false);
  }
  function changeFilter(v: string) {
    setBriefCopied(false);
    setFilter(v);
    setIndex(0);
    setGuess(null);
    setRevealed(false);
  }
  async function runLive() {
    if (!claim.trim() || !siteId) return;
    setBusy(true);
    setNotice("");
    setLiveResult(null);
    try {
      const r = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim, siteId }),
        signal: AbortSignal.timeout(90000),
      });
      if (!r.ok)
        throw Error("Start the local Python server to run the trained model.");
      setLiveResult(await r.json());
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Local inference failed.");
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!selected) return;
    const report = {
      title: "Culvert Cut evidence brief",
      claim: selected.claim,
      inventory: selected.site,
      model: data?.model,
      result: selected.adapter,
      expected: selected.expected,
      provenance:
        "Recorded local inference on a held-out test case; model text is not an agency determination.",
      method: data?.method,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `culvert-cut-${selected.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const followupQuestions: Record<string, string> = {
    connectivity: "Is there a verified upstream connectivity assessment, including other barriers between this crossing and spawning habitat?",
    observation: "Are direct fish observations available for this crossing, separate from the inventory's fish-use classification?",
    chemistry: "Is there site-specific water sampling available, with collection dates and measured parameters?",
    impaired: "Has this exact crossing been spatially matched to a current water-quality assessment, and which listing applies?",
  };
  const followup = selected && (followupQuestions[selected.kind] || "Is this passage classification still current, and are there more recent surveys or completed corrections?");
  const publicWorksDraft = selected ? `Hello, I am asking about WDFW Site ${selected.site.id} on ${selected.site.stream}. The supplied inventory records its passage status as ${selected.site.status}. ${followup}\n\nOfficial source: ${selected.site.official}\nThis is a request for verification, not a report of a newly observed condition.` : "";
  return (
    <main className="evidence-lab">
      <section className="lab-intro">
        <div>
          <div className="eyebrow">
            <span className="lab-dot" /> THE WRIA 8 EVIDENCE LAB
          </div>
          <h1>
            Can the evidence
            <br />
            <em>carry the claim?</em>
          </h1>
          <p>
            A small, locally trained model checks what fish-passage records
            actually say—and where the evidence runs out.
          </p>
          <div className="lab-intro-actions">
            <button
              onClick={() =>
                document
                  .getElementById("claim-workbench")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Challenge the specialist <ArrowRight size={16} />
            </button>
            <button onClick={() => onExplore()}>
              Explore 1,931 crossings <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
        <div className="lab-concept">
          <div className="concept-label">THE LEAP WE ARE TESTING</div>
          <div className="concept-fact">
            <Check size={18} />
            <span>
              “This crossing is passable.”
              <small>A statement about one structure</small>
            </span>
          </div>
          <div className="concept-connector">
            <span />
            DOES THAT MEAN…
            <span />
          </div>
          <div className="concept-claim">
            <span className="question-mark">?</span>
            <span>
              “Fish can reach every
              <br />
              upstream spawning reach.”<small>That needs more evidence.</small>
            </span>
          </div>
          <div className="concept-footer">
            <ShieldCheck size={15} /> Teach the model where a fact ends.
          </div>
        </div>
      </section>
      {data && (
        <section
          className="lab-metrics"
          aria-label="Measured evaluation results"
        >
          <div>
            <span className="metric-label">BASE MODEL</span>
            <b>
              {Number(
                ((data.base.correctVerdicts / data.base.total) * 100).toFixed(
                  1,
                ),
              )}
              <small>%</small>
            </b>
            <p>
              {data.base.correctVerdicts}/{data.base.total} correct verdicts
            </p>
          </div>
          <div className="metric-specialist">
            <span className="metric-label">TRAINED SPECIALIST</span>
            <b>
              {Number(
                (
                  (data.adapter.correctVerdicts / data.adapter.total) *
                  100
                ).toFixed(1),
              )}
              <small>%</small>
            </b>
            <p>
              {data.adapter.correctVerdicts}/{data.adapter.total} correct
              verdicts
            </p>
          </div>
          <div>
            <span className="metric-label">THE TEST</span>
            <b>
              {data.dataset.testSites}
              <small> unseen sites</small>
            </b>
            <p>120 cases · identical context · raw output</p>
          </div>
          <button className="metric-method" onClick={() => setMethod(true)}>
            <FlaskConical size={22} />
            <span>
              Inspect the experiment
              <small>Method, limitations, and every result</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        </section>
      )}
      {data && <p className="lab-score-note">Measured on a rule-labeled, held-out inventory benchmark. Verdict accuracy does not certify every explanation.</p>}
      <section id="claim-workbench" className="claim-workbench">
        <div className="workbench-heading">
          <div>
            <span className="eyebrow">READ. DECIDE. REVEAL.</span>
            <h2>Put a claim on the record.</h2>
          </div>
          <div className="workbench-modes">
            <button
              className={!live ? "selected" : ""}
              onClick={() => setLive(false)}
            >
              Recorded model trials
            </button>
            <button
              className={live ? "selected" : ""}
              onClick={() => setLive(true)}
            >
              Run a new claim <Terminal size={13} />
            </button>
          </div>
        </div>
        <p className="lab-disclosure">
          {live
            ? "New claims run on the local trained model. Your input is not sent to an external LLM service."
            : "These are saved, unedited generations from actual local model runs—not live inference. Choose any case, including failures."}
        </p>
        {!live && (
          <div className="case-toolbar">
            <label>
              Case group
              <select
                value={filter}
                onChange={(e) => changeFilter(e.target.value)}
              >
                <option value="all">All 120 cases</option>
                <option value="improved">Improved after training</option>
                <option value="errors">Specialist failures</option>
                <option value="supported">Supported claims</option>
                <option value="contradicted">Conflicting claims</option>
                <option value="insufficient">Missing evidence</option>
              </select>
            </label>
            <div className="case-pagination">
              <button
                disabled={!cases.length}
                aria-label="Previous case"
                onClick={() => move(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <span>
                {cases.length ? index + 1 : 0} / {cases.length}
              </span>
              <button
                disabled={!cases.length}
                aria-label="Next case"
                onClick={() => move(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
        {error && !live && (
          <p role="alert">
            {error}{" "}
            <button onClick={() => onExplore()}>Open the basin map →</button>
          </p>
        )}
        {!error && !data && !live && <p>Loading recorded experiment…</p>}
        {!live && data && !selected && (
          <div className="empty-cases">
            No cases in this group. All groups remain available, even when
            empty.
          </div>
        )}
        {(selected || live) && (
          <div className="trial-grid">
            <article className="claim-card">
              <div className="eyebrow">
                <FileText size={14} />{" "}
                {live
                  ? "YOUR CLAIM"
                  : `${selected.id.toUpperCase()} · ${selected.kind.replaceAll("-", " ")}`}
              </div>
              {live ? (
                <>
                  <label className="live-site">
                    Official site
                    <select
                      value={siteId}
                      disabled={busy}
                      onChange={(e) => {
                        setSiteId(e.target.value);
                        setLiveResult(null);
                      }}
                    >
                      {sites.map((s) => (
                        <option key={s.properties.id} value={s.properties.id}>
                          {s.properties.id} · {s.properties.stream}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    value={claim}
                    disabled={busy}
                    onChange={(e) => {
                      setClaim(e.target.value);
                      setLiveResult(null);
                    }}
                    placeholder="This crossing is passable, so fish can reach every upstream spawning reach."
                    aria-label="Claim to audit"
                    maxLength={1000}
                  />
                  {!local && (
                    <div className="local-required">
                      <Terminal size={17} />
                      <p>
                        Live inference runs on your Mac. This static public site
                        contains the full recorded experiment.
                        <code>
                          npm run dev
                          <br />
                          .venv/bin/uvicorn server:app --port 8000
                        </code>
                        <a
                          href="https://github.com/ethaenall/culvert-cut#specialist-model-reproducible-training-honest-status"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Local setup instructions ↗
                        </a>
                      </p>
                    </div>
                  )}
                  <button
                    className="primary"
                    disabled={!local || busy || !claim.trim()}
                    onClick={runLive}
                  >
                    {busy ? "Running the local model…" : "Audit this claim"}
                    <Sparkles size={15} />
                  </button>
                  {notice && <p role="alert">{notice}</p>}
                </>
              ) : (
                <>
                  <blockquote>“{selected.claim}”</blockquote>
                  <p className="your-call">
                    Your call. What does the supplied record establish?
                  </p>
                  <div className="verdict-choices">
                    {(
                      ["supported", "contradicted", "insufficient"] as Verdict[]
                    ).map((v) => (
                      <button
                        key={v}
                        title={descriptions[v]}
                        className={guess === v ? "selected" : ""}
                        onClick={() => {
                          setGuess(v);
                          setRevealed(true);
                        }}
                      >
                        {names[v]}
                        <ArrowRight size={13} />
                      </button>
                    ))}
                  </div>
                  <button
                    className="reveal-button"
                    onClick={() => setRevealed(true)}
                  >
                    Reveal both model responses <ChevronRight size={14} />
                  </button>
                </>
              )}
            </article>
            <article className="source-card">
              <div className="source-card-head">
                <span className="eyebrow">THE EVIDENCE THE MODEL RECEIVED</span>
                <span className="source-stamp">WDFW SNAPSHOT</span>
              </div>
              {source && (
                <>
                  <h3>{String(source.stream)}</h3>
                  <div className="source-site">
                    SITE {String(source.id)} ·{" "}
                    {String(source.survey || "Survey date unknown")}
                  </div>
                  <dl>
                    {[
                      ["status", "Passage status"],
                      ["fishUse", "Fish use"],
                      ["owner", "Owner type"],
                      ["feature", "Feature"],
                      ["access", "Upstream access"],
                      ["impairment", "303(d) intersection"],
                    ].map(([field, label]) => (
                      <div
                        key={field}
                        className={
                          !live && selected?.evidenceFields.includes(field)
                            ? "highlight-field"
                            : ""
                        }
                      >
                        <dt>{label}</dt>
                        <dd>{String(source[field] ?? "Not supplied")}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="source-links">
                    <a
                      href={String(source.official)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Original record <ArrowUpRight size={13} />
                    </a>
                    <button onClick={() => onExplore(String(source.id))}>
                      Locate crossing <MapPin size={13} />
                    </button>
                  </div>
                  <small>
                    The record describes an inventory assessment, not a live
                    site inspection.
                  </small>
                </>
              )}
            </article>
          </div>
        )}
        {!live && selected && revealed && (
          <section className="trial-results" aria-live="polite">
            <div className="expected-result">
              <ShieldCheck size={21} />
              <div>
                <b>
                  {guess
                    ? guess === selected.expected.verdict
                      ? "You followed the evidence."
                      : "Here is the distinction."
                    : "The reference assessment"}
                </b>
                <p>
                  <strong>{names[selected.expected.verdict]}.</strong>{" "}
                  {selected.expected.reason}{" "}
                  <span className="citation">{selected.site.id}</span>
                </p>
                <small>
                  Reference label is rule-derived from the supplied fields, not
                  expert adjudication.
                </small>
              </div>
            </div>
            <div className="model-comparison">
              {(["base", "adapter"] as const).map((mode) => {
                const run = selected[mode];
                return (
                  <article key={mode} className={`model-output ${mode}`}>
                    <div className="output-heading">
                      <span>
                        {mode === "base"
                          ? "BEFORE · BASE QWEN"
                          : "AFTER · CULVERT CUT LoRA"}
                      </span>
                      <span
                        className={
                          run.correctVerdict ? "result-pass" : "result-fail"
                        }
                      >
                        {run.correctVerdict
                          ? "Verdict correct"
                          : "Verdict incorrect"}
                      </span>
                    </div>
                    <h3>
                      {run.parsed
                        ? names[run.parsed.verdict]
                        : "Invalid structured response"}
                    </h3>
                    <p>
                      {run.parsed?.reason ||
                        "The output did not follow the requested JSON schema."}
                    </p>
                    {run.validCitations && <a className="citation" href={selected.site.official} target="_blank" rel="noreferrer">{selected.site.id} ↗</a>}
                    <div className="output-meta">
                      <span>
                        {run.validCitations
                          ? "Citation format valid"
                          : "Citation format failed"}
                      </span>
                      <span>{run.seconds.toFixed(2)}s · local generation</span>
                    </div>
                    <details>
                      <summary>Inspect unedited model output</summary>
                      <pre>{run.raw}</pre>
                    </details>
                  </article>
                );
              })}
            </div>
            <div className="trial-actions">
              <button onClick={download}>
                <Download size={15} /> Download evidence brief
              </button>
              <button onClick={() => move(1)}>
                Challenge another claim <ArrowRight size={15} />
              </button>
            </div>
            <aside className="next-evidence">
              <span className="eyebrow">TURN THE CHECK INTO A USEFUL QUESTION</span>
              <h3>Ask for the missing evidence.</h3>
              <p>{followup}</p>
              <details><summary>Review public-works draft</summary><p className="draft-text">{publicWorksDraft}</p></details>
              <button onClick={async () => {
                try { await navigator.clipboard.writeText(publicWorksDraft); setBriefCopied(true); }
                catch { setBriefCopied(false); }
              }}>{briefCopied ? "Copied · ready to paste" : "Copy question + official source"} <FileText size={15} /></button>
              <small>You choose the recipient. Nothing is sent from this app.</small>
            </aside>
          </section>
        )}
        {live && liveResult && (
          <section className="trial-results" aria-live="polite">
            <article className="model-output adapter">
              <div className="output-heading">
                <span>LIVE LOCAL {liveResult.mode.toUpperCase()}</span>
                <span>{liveResult.seconds}s</span>
              </div>
              <h3>
                {liveResult.parsed
                  ? names[liveResult.parsed.verdict as Verdict]
                  : "Model response needs review"}
              </h3>
              <p>
                {liveResult.parsed?.reason ||
                  "The model did not produce a response with valid source citations."}
              </p>
              {liveResult.citationCheck && <a className="citation" href={liveResult.site.official} target="_blank" rel="noreferrer">{liveResult.site.id} ↗</a>}
              <p className="lab-disclosure">{liveResult.note}</p>
              <details>
                <summary>Inspect unedited model output</summary>
                <pre>{liveResult.raw}</pre>
              </details>
            </article>
          </section>
        )}
      </section>
      <section className="lab-closing">
        <div>
          <span className="eyebrow">WHY THIS MATTERS</span>
          <h2>
            A crossing is one fact.
            <br />A connected stream takes more.
          </h2>
          <p>
            Use official records to ask a better question about local
            restoration. The specialist helps identify the limits of the
            evidence; it does not certify passage, prescribe engineering work,
            or predict fish survival.
          </p>
        </div>
        <button onClick={() => onExplore()}>
          Follow the water <ArrowUpRight size={22} />
        </button>
      </section>
      <div className="lab-footer">
        <span>CULVERT CUT · EARTH FORWARD / 2026</span>
        <a href={`${import.meta.env.BASE_URL}demo.html`}>Watch the 3-minute demo ↗</a>
        <a
          href="https://github.com/ethaenall/culvert-cut"
          target="_blank"
          rel="noreferrer"
        >
          Code, weights & reproducibility ↗
        </a>
      </div>
      {method && data && (
        <div className="modal-backdrop" onClick={() => setMethod(false)}>
          <section
            className="source-modal experiment-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Experiment method"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-top">
              <h2>Show the work.</h2>
              <button
                aria-label="Close experiment"
                onClick={() => setMethod(false)}
              >
                <X />
              </button>
            </div>
            <p>{data.method}</p>
            <dl>
              <div>
                <dt>Base</dt>
                <dd>{data.model}</dd>
              </div>
              <div>
                <dt>Training</dt>
                <dd>
                  {data.dataset.trainPairs.toLocaleString()} pairs · rank-16
                  LoRA · local Apple GPU
                </dd>
              </div>
              <div>
                <dt>Held out</dt>
                <dd>40 Site IDs, excluded from training and validation</dd>
              </div>
              <div>
                <dt>Base verdicts</dt>
                <dd>{data.base.correctVerdicts}/120</dd>
              </div>
              <div>
                <dt>Specialist verdicts</dt>
                <dd>{data.adapter.correctVerdicts}/120</dd>
              </div>
              <div>
                <dt>Base citation schema</dt>
                <dd>{data.base.validCitations}/120</dd>
              </div>
              <div>
                <dt>Specialist citation schema</dt>
                <dd>{data.adapter.validCitations}/120</dd>
              </div>
            </dl>
            <p>
              These scores cover verdict labels and exact citation IDs. They do
              not prove every explanation is correct, establish real-world
              ecological outcomes, or measure performance on arbitrary
              questions. Labels and training examples are programmatic;
              independent expert review remains future work.
            </p>
            <a
              href={`${import.meta.env.BASE_URL}data/model-evaluation.json`}
              target="_blank"
              rel="noreferrer"
            >
              Download all prompts, contexts, and raw outputs ↗
            </a>
            <a
              href="https://github.com/ethaenall/culvert-cut"
              target="_blank"
              rel="noreferrer"
            >
              Reproduce the experiment ↗
            </a>
          </section>
        </div>
      )}
    </main>
  );
}
