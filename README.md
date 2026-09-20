# Culvert Cut

**Follow the water.** A WRIA 8 map of real fish-passage barriers, habitat-access context, and water-quality assessments, with a trained local specialist that tests claims against official evidence.

[Live demo](https://ethaenall.github.io/culvert-cut/) · [Public repository](https://github.com/ethaenall/culvert-cut) · [Narrated demo](https://ethaenall.github.io/culvert-cut/demo.html)

Built for NextStep Hacks 2026 — Earth Forward. A new project scoped as a 20-hour student build. No prize, eligibility, or measured restoration outcome is claimed.

## Run the working demo

Requires Node 22.18+ (or Node 24) and npm.

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. `npm run build` creates a static `dist/` directory; `npm run preview` serves the build. No API key, account, Python, model download, or GPU is needed for the app. The included Pages workflow builds and publishes the static demo. Map tiles and optional fonts require internet; the bundled records, filters, drawer, and Ask work without external data APIs. Use “Browse records” if WebGL or tiles are unavailable. This is not a service-worker offline app.

![Culvert Cut Evidence lab](docs/evidence-lab.png)

## What it does

- Evidence lab: challenge a claim, inspect actual base/adapter outputs, and copy a source-linked question for public works. All 120 trials are available.
- MapLibre map centered on Sammamish, Issaquah, and Redmond, with official streams and 1,931 real WDFW WRIA 8 site records.
- Total / partial / passable / unknown symbols with both color and shape. Filters intersect; near-me searches within 5 km, falling back to Sammamish City Hall (47.6163, -122.0356).
- King County coho intrinsic potential and current anadromous access overlay, plus Ecology 303(d) assessment geometry. Potential habitat is distinct from species observations.
- Site drawer with recorded stream, feature, fish use, owner type, survey date, and explicit unknowns; official report link; three-sentence briefing copy.
- Twelve field-note stories, including Zackuse, Issaquah Creek, Juanita, Sammamish River heat, driveway culverts, highway / city contrast, and spawn-watch context.
- Local-only photo queue using browser localStorage. Images must be under 1.5 MB; clear the queue from the drawer. No submission endpoint exists.
- Ask retrieves up to three site records and two source snippets, then renders grounded statements with source chips. Empty retrieval refuses. Optional local model output passes an extractive allowlist gate before display.
- Demo first-flush advisory: `rain in next 24h AND dry days >= 5`. Demo rain toggles the first input; the canned climate state has six dry days. No live forecast or chemistry is fetched.

## A one-minute walkthrough

1. Open the Evidence lab and read the claim beside its official record.
2. Choose **Not established** on the upstream-access example; reveal both actual model responses.
3. Open the unedited outputs and the experiment method. All cases, including errors, are available.
4. Review the public-works draft: it asks for a verified network assessment and links the official crossing record.
5. Locate the crossing on the basin map; inspect habitat and water-quality context separately.

The demonstration is about moving from a local record to a defensible question. The trained model handles the language experiment; deterministic code displays official facts and prepares the resident briefing.

## Earth Forward

Pipes, hot water, and first-flush runoff are connected pressures in one basin. A restored crossing can improve passage while heat or downstream barriers still limit habitat access. Culvert Cut makes those distinctions visible and helps residents prepare a specific question for public works. It does not prioritize engineering projects, detect new barriers, promise habitat gains, or measure 6PPD-quinone.

## Official data and refresh

Run `python3.11 scripts/fetch_layers.py`, then `python3.11 scripts/build_stories.py` and `python3.11 scripts/build_jsonl.py`. Fetching uses the standard library, queries IDs first, downloads chunks, checks truncation, and replaces each successful snapshot atomically. Failures preserve that layer's prior file and are recorded in `public/data/manifest.json`; a refresh with any failure exits nonzero. The manifest timestamp records the refresh attempt, so inspect its errors before treating all layers as newly refreshed.

Bounding box: longitude -122.25 to -121.85; latitude 47.45 to 47.78. WDFW points also require `WRIANumber=8`. Other overlays are bbox extracts, not a WRIA polygon clip. All bundled inventory points were fetched from official services; no synthetic crossings were needed.

| Layer | Bundled features | Source |
|---|---:|---|
| WDFW passage sites | 1,931 | [FP_Sites MapServer](https://geodataservices.wdfw.wa.gov/arcgis/rest/services/ApplicationServices/FP_Sites/MapServer) |
| King County streams `wtrcrs_line` | 1,989 | [Service](https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/WTRCRS_LINE_176/FeatureServer/0) |
| King County `fp_cohointrinsicpotential_line` | 12,194 | [Service](https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/FP_COHOINTRINSICPOTENTIAL_LINE_2880/FeatureServer/0) |
| King County `fp_fishpassagesites_point` | 5,338 | [Service](https://services.arcgis.com/Ej0PsM5Aw677QF1W/arcgis/rest/services/FP_FISHPASSAGESITES_POINT_2879/FeatureServer/0) |
| Ecology 303(d) | 340 | [Current assessment service](https://services.arcgis.com/6lCKYNJLvwTXqrmp/arcgis/rest/services/WQ/FeatureServer/4) |

King County points are retained for pipeline inspection, not merged into the WDFW display: cross-inventory deduplication has not been verified. WDFW layer classifications and coded-value domains drive normalization. Original properties remain in the GeoJSON; `source`, `status`, and display fields are added. Unknown includes unknown passability at a known barrier; “barriers only” includes those when the raw barrier code is yes. Non-fish-bearing, diversion, and natural-barrier layers are outside this crossing-focused snapshot. WSDOT context comes from actual WDFW records with `ProjectName=WSDOT`, not a separately fetched injunction inventory.

Sources for explanations:

- [WDFW Fish Passage Inventory, Assessment, and Prioritization Manual (2019, 284 pages)](https://wdfw.wa.gov/publications/02061): assessment guidance and habitat-survey context; snippets are concise paraphrases, not invented page quotations.
- [WRIA 8 2025 progress report](https://govlink.org/watersheds/8/reports/WRIA82025ProgressReport.pdf): 28.6 riparian acres planted against a 69-acre Sammamish River goal, approximately 41%.
- [City of Sammamish Zackuse project](https://www.sammamish.us/projects/zacuse-creek-fish-passage-restoration/) and [historical King County kokanee emergency](https://kcemployees.com/2018/05/11/taking-emergency-action-to-prevent-the-possible-extinction-of-native-kokanee-salmon/): historical context, not current run counts. The [citywide barrier assessment](https://www.sammamish.us/projects/fish-passage-barrier-assessment/) confirms the City's partnership with Wild Fish Conservancy; its results are not joined to individual pins.
- [Ecology 6PPD background](https://ecology.wa.gov/waste-toxics/reducing-toxic-chemicals/reducing-toxic-chemicals-washington/6ppd) and [King County sampling report](https://your.kingcounty.gov/dnrp/library/2024/kcr3832/kcr3832.pdf): toxicity and sampling context; no concentration measurement is generated.
- [Ecology assessment explanation](https://ecology.wa.gov/water-shorelines/water-quality/water-improvement/assessment-303d-list): listings are assessments, not live readings.

## Specialist model: reproducible training, honest status

**The local specialist is now trained, evaluated, and included.** The Evidence lab is the opening experience: read a claim, inspect the exact record, make your own assessment, then reveal both models' unedited outputs. All 120 cases and all four specialist verdict failures remain inspectable. The map and resident briefing workflow remain available through “Explore the basin.”

| Measured check | Base Qwen | Culvert Cut LoRA |
|---|---:|---:|
| Correct claim verdicts | 40 / 120 (33.3%) | 116 / 120 (96.7%) |
| Exact citation-array format | 0 / 120 | 120 / 120 |
| Mean generation time in this run | 1.05 seconds | 0.62 seconds |

The base returned empty arrays or source URLs rather than the requested array of Site ID strings; zero citation-format passes does **not** mean it never cited a source. Timing is a local observation, not a controlled performance benchmark. The headline score is verdict correctness, separate from formatting.

The comparison uses identical retrieved context and instructions, greedy decoding, and one raw generation per case. No template repair contributes to scores. The 120 rule-labeled cases come from 40 unseen sites excluded from training and validation. Test wording differs from training, but the task families are related. These numbers do not measure every factual statement, arbitrary scientific reasoning, or environmental outcomes. All four wrong verdicts abstain on partial-versus-total passage claims; those explanations also incorrectly mention upstream classification. An earlier 0.5B experiment informed the revised training set; its test sites were excluded and forty fresh sites reserved for this final evaluation. See [MODEL_CARD.md](MODEL_CARD.md) and [all raw results](public/data/model-evaluation.json).

The specialist dataset has 3,078 training pairs and 80 validation examples on a separate 20 sites. It retains domain explainers alongside supported, contradicted, and insufficient-evidence claim audits. The original 3,027-pair explainer dataset remains in `data/train.jsonl`. Both are generated from actual official records and concise source paraphrases; labels are programmatic, not expert review.

### Actual training run

Qwen2.5-1.5B-Instruct was fine-tuned on this Mac's Apple M5 Pro GPU using MLX LM 0.31.3. The run completed 770 steps, batch size 4, sequence limit 768, and rank-16 LoRA on q/k/v/o projections. Scale 2 is equivalent to alpha 32 divided by rank 16. Peak training memory was 11.130 GB. The 17.5 MB adapter, configuration, run metadata, and hashes are committed under `adapter/mlx/`; the training log is in `data/specialist/training_log.txt`. The base weights download from Hugging Face when first used. No external LLM inference API is called.

```sh
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements-mlx.txt   # Apple silicon path
python scripts/build_specialist.py
MODEL_NAME=Qwen/Qwen2.5-1.5B-Instruct python train.py --backend mlx
python scripts/evaluate_specialist.py --mode base
python scripts/evaluate_specialist.py --mode adapter
python scripts/evaluate_specialist.py --mode publish
python eval_hallucination.py         # actual adapter: 40/40 cite IDs, zero unknown IDs
```

The separate 40-site explanation check passed with no invented identifiers or missing expected citations. It does not validate every explanation. Unknown IDs are detected with a limited regex; arbitrary ID formats and uncited factual errors need broader review.

For NVIDIA CUDA or a CPU fallback, use a separate Python environment installed from `requirements.txt`, then `python train.py --backend peft`. The original PEFT LoRA + TRL SFTTrainer implementation remains available, with a default two epochs and a 200-step explicit `--cpu` route. MLX and PEFT adapter formats are separate and must not be interchanged. `MODEL_NAME` overrides the base for either training backend. The training default remains 0.5B per the original brief; the command above explicitly reproduces the final 1.5B run. Inference and evaluation read the actual base from the bundled adapter configuration.

### Run live local claims

After installing the MLX requirements into `.venv`, `npm run dev:local` starts the app and model API together. Alternatively, use two terminals:

```sh
# Terminal one
npm run dev
# Terminal two, with the MLX environment active
uvicorn server:app --host 127.0.0.1 --port 8000
```

Open “Run a new claim” in the Evidence lab, select any official Site ID, and type a claim. `/api/audit` retrieves the canonical record, runs the actual adapter, and returns raw output, parsed verdict, citation-format status, and elapsed time. It never trusts factual fields submitted by the browser. Structure/citation checks do not certify the interpretation; inspect the source beside the response.

The public GitHub Pages deployment is static: its evidence trials are **recorded actual model runs**, explicitly labeled, not live inference. New live claims require the local service. The conventional Ask tab retains reliable templates and its optional local model route with an extractive output gate. Those gated responses do not contribute to the model benchmark.

### Zackuse comparison and submission

`data/comparison_actual.json` contains actual base/adapter responses on the same Zackuse Site 920121 context. That showcase site is not claimed to be held out. Recreate it with `python scripts/capture_comparison.py`. The Evidence lab's scored comparison instead uses the full held-out benchmark.

On Zackuse Site 920121, both models received the claim “Fish can reach all habitat upstream of this crossing” and the same official snapshot:

| Actual base response | Actual trained response |
|---|---|
| **Supported — incorrect.** “The inventory snapshot shows a culvert crossing the Zackuse Cr stream, which is consistent with the claim that fish can reach all habitat upstream of this crossing.” | **Insufficient.** “The snapshot has no verified upstream connectivity assessment.” |
| Empty citation array | `["920121"]` |

This is a disclosed showcase example, not an additional benchmark score. The source lists a total barrier; it provides no verified whole-network assessment. Full unedited JSON is in the comparison artifact above.

## What is mocked or incomplete

Weather is a labeled canned demonstration; photos are local mock reports. Story-only place coordinates are approximate and labeled “illustrative pin pending live join.” They do not create inventory sites or assign barrier status. A driveway is classified as a culvert; “driveway” comes from its recorded road name. Passable is not automatically corrected. The WDFW record's correction-years field is displayed when present.

The coho overlay uses line thickness for the source `SCORE_02CF` potential score. Of 12,194 segments, 9,694 have null access, 2,439 have the undocumented value `No`, 58 say `No salmon habitat`, and three say `Inaccessible`. The undocumented `No` is treated as unknown, not silently translated into inaccessible. The source domain defines Accessible / Partially accessible, but this snapshot has no records carrying those values.

Site-level 303(d) intersection, stream-network routing, piped length, named owners, fish observations, and species-specific access above are not established by the provided site schema. These remain unknown/not supplied. The impairment overlay renders official assessment polygons, including all parameters, rather than pretending polygon boundaries are exact stream centerlines. It is not a water-safety tool or engineering assessment. First-flush advice is a general runoff-reduction reminder, not a validated local risk forecast.

MapLibre makes the JS bundle relatively large; OpenStreetMap public raster tiles carry attribution. The Google font has system-font fallbacks. No external imagery, proprietary GIS, private records, or secrets are included.

## Before vs During

**Before:** no project source, dataset, app, or model work existed in this repository.

**During:** app implementation, official snapshots, normalization, story/source curation, both domain datasets, actual Apple-GPU adapter training, raw paired evaluation, checks, and submission materials were created for this build. AI-assisted implementation must be disclosed according to the event's rules. The repository does not assert that any particular student personally completed every step.

## Validation

```sh
npm test
npm run build
python3.11 -m unittest discover -s tests
python3.11 eval_hallucination.py --template
# Browser regression checks (one-time browser install):
npx playwright install chromium
npm run dev
npx playwright test
```

Checks cover filter intersections, near-me distances, empty retrieval, citations, first-flush boundary conditions, three-sentence briefings, disjoint train/validation contexts, model-ID guard behavior, and desktop/mobile browser interactions. The published specialist result comes from actual local training and raw paired evaluation.

Submission materials: `DEVPOST.md` and `VIDEO_SCRIPT.md`. The included narrated demo is approximately three minutes; synthetic narration is disclosed in the script. The deadline from the brief is September 20, 2026, 2:00 pm PDT.
