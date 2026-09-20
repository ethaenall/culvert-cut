# Culvert Cut — three-minute demo script

Target runtime: 3:00; rehearse within 2:45–3:15. This is a script, not a completed video. Start with the app open, no filters, no rain; keep README's comparison fixture ready in a second tab. Record at 1440×900 or larger. Use the template badge visibly; do not imply an adapter was trained.

| Time | Screen action | Narration |
|---|---|---|
| 0:00–0:25 | Basin map → Zackuse field note (01) → Issaquah Creek State Park (02) | “An ordinary road crossing can interrupt a salmon's route home. In the winter of 2017–18, fewer than twenty Lake Sammamish kokanee returned. That is historical context, not today's count. Culvert Cut helps us inspect three connected pressures in one basin: pipes, hot water, and first-flush runoff.” |
| 0:25–0:50 | Turn on barriers, fish use, culverts; show counts and legend. Overlay the six-card montage described below. | “These are real official inventory records in WRIA 8. Filter for barriers where fish use is recorded, then focus on culverts. Squares are total barriers, circles are partial, diamonds are passable, and triangles are unknown. The inventory is incomplete, and unknown never means passable.” |
| 0:50–1:10 | Search `920121`, browse records, open Zackuse total site; copy briefing | “Here is Zackuse Site 920121. The drawer shows the recorded status, feature, owner type, and survey date. A three-sentence briefing includes the exact identifier and coordinates. It asks public works to verify the condition and next step; it does not pretend to submit a repair request.” |
| 1:10–1:30 | Close drawer; clear search; enable coho potential/access | “Habitat can exist while a pipe blocks a route. King County models coho potential and current anadromous access. That is valuable context, but this version has no verified network join. We cannot say from one pin whether every coho or kokanee can reach habitat above it.” |
| 1:30–1:45 | Enable 303(d); open Sammamish River second-squeeze (03), then Heat without a crossing (10) | “Passage is only one squeeze. These are Ecology's official assessment areas. Temperature and dissolved oxygen listings describe another pressure. Riparian planting reached 28.6 of the 69-acre Sammamish River goal, about forty-one percent.” |
| 1:45–2:00 | Open I-405 sampling story (04), close drawer, then switch Demo rain on | “Rain after six canned dry days triggers this first-flush reminder. The five-dry-day threshold is a demonstration heuristic. There is no live forecast, chemical reading, or 6PPD detector here.” |
| 2:00–2:20 | Ask tab; click Explain Zackuse Creek; show citation chips, then ask an unrelated query | “Ask this basin retrieves records and source snippets. Each displayed statement carries a source chip. Ask something outside those records and it refuses. The default is a deterministic template, so the core demo needs no GPU or hosted language-model API.” |
| 2:20–2:40 | README side-by-side fixture, then dataset card and train.py | “We also built a 3,027-example specialist dataset and a Qwen LoRA training pipeline. Forty sites are held out. This side-by-side fixture shows the intended grounded behavior, not a fabricated training result. No adapter is trained in this delivery; the included comparison script records actual outputs after training.” |
| 2:40–3:00 | Return to Redmond trail spawn-watch card (11), open Sources & limitations, finish on basin | “Our biggest lesson was to keep evidence and inference separate. A citation alone is not enough, and missing data deserves an honest unknown. Culvert Cut connects a local map to a practical action: follow one stream, inspect one official record, and ask public works a better question.” |

If training is actually completed before recording, replace 2:20–2:40 with the genuine `comparison_actual.json` outputs and the measured evaluator results. Describe failures as well as successes; never call an authored anti-example a base-model output. Keep the same runtime.

## Required story coverage and recording plan

Keep the spoken timeline above at 3:00. Record the following short map-and-drawer clips separately, then place them as B-roll over the existing narration; these clips do not add runtime. Keep each title and status readable. For story clips, clear filters so the selected crossing stays visible, and close each drawer before selecting the next card.

| Time within the three-minute edit | Required story shown |
|---|---|
| 0:05–0:14 | 01 Zackuse / Louis Thompson corridor |
| 0:14–0:23 | 02 Issaquah Creek / State Park; keep illustrative label visible |
| 0:25–0:32 | Live filter demonstration and legend |
| 0:32–0:35 | 05 Juanita Creek |
| 0:35–0:38 | 06 Not only highways: driveway road field + Culvert feature |
| 0:38–0:41 | 07 A way through: passable contrast |
| 0:41–0:44 | 08 A partial barrier |
| 0:44–0:47 | 09 Fish use yes / total barrier |
| 0:47–0:50 | 12 Highway / city: split-screen WSDOT story and its Compare City-owned crossing result |
| 0:50–1:10 | Zackuse total Site 920121, briefing and official link |
| 1:30–1:38 | 03 Sammamish River mainstem temperature / oxygen context |
| 1:38–1:45 | 10 Heat without a crossing; no invented passability classification |
| 1:45–1:50 | 04 Sammamish River at I-405 sampling context |
| 1:50–2:00 | Demo rain banner |
| 2:40–2:46 | 11 Redmond trail spawn-watch card |

The remaining Ask, comparison, and closing shots follow the main timeline. This covers all twelve stories while reserving the detailed drawer explanation for one crossing.
