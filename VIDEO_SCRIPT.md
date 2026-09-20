# Culvert Cut — recorded demo and script

Runtime: approximately 3:09 (within 2:45–3:15). This is an actual recording of the local app, with macOS Samantha synthesized narration. It is not presented as a student speaking. No generated video scenes or invented model responses are used.

The video distinguishes recorded held-out model trials from new live local inference. It includes the map, filters, twelve story cards, habitat and impairment overlays, labeled demo rain, and the citation-backed Ask flow. Headline numbers come from the committed final evaluation: 40/120 base verdicts and 116/120 specialist verdicts. The four specialist failures remain public.

[Watch the narrated demo](https://ethaenall.github.io/culvert-cut/demo.html)

| Time | Screen | Narration |
|---|---|---|
| 0:00–0:16 | Intro | An official record describes one crossing. Does that tell us whether fish can reach every spawning reach upstream? It is a tempting leap, but a different claim. Culvert Cut is a small, locally trained specialist that makes the gap between evidence and conclusion visible. |
| 0:16–0:33 | Claim | Here is a real record held out from training. The claim says this crossing guarantees an open route to every upstream spawning reach. Read the source beside it. Passage is recorded, but a verified upstream network assessment is missing. Make your own call before revealing either model. |
| 0:33–0:55 | Compare | The base model calls this contradicted. Our trained specialist says not established: the snapshot cannot answer the connectivity question. That distinction matters. Missing evidence is not the same as evidence of the opposite. Both responses are actual, unedited local generations, with identical instructions and context. You can inspect the raw output. |
| 0:55–1:16 | Metrics | Across one hundred twenty cases from forty unseen sites, the base produced forty correct verdicts. After training, that became one hundred sixteen: ninety-six point seven percent. Citation format is measured separately. This is a narrow, programmatically labeled benchmark, not a claim that the model understands every ecological question. |
| 1:16–1:29 | Failures | The four wrong verdicts are visible too. Here the specialist makes a mistake. We publish all prompts, records, and outputs so a judge can inspect the limits, rather than relying on a handpicked success. |
| 1:29–1:50 | Live | The public website replays recorded model trials. This local mode runs new claims through the actual adapter. Select a site, type a claim, and inspect the returned explanation beside its source. No external language model service receives the question. Citation checks still do not certify that every interpretation is correct. |
| 1:50–2:20 | Map | Behind the experiment is a working map of nineteen hundred thirty-one official fish-passage records in the Lake Washington, Cedar, and Sammamish basin. Filter crossings, compare total and partial barriers, and explore field notes from Zackuse Creek to the Sammamish River. The original report and a public-works briefing are one click away. |
| 2:20–2:42 | Layers | Pipes are only one pressure. King County habitat potential and Ecology water-quality assessments add context. The first-flush banner is a labeled demonstration, not a chemical sensor. We trained the one-point-five-billion-parameter model on this Mac using a small LoRA adapter, and included the weights, dataset, and reproducible evaluation. |
| 2:42–2:52 | Ask | Ask this basin also offers reliable, cited record summaries without loading a model. Follow a source, then copy a specific public-works question. |
| 2:52–3:09 | Close | Our lesson is that an environmental AI should show where its evidence ends. Culvert Cut combines local records, a measurable training result, and a practical way to question an unsupported conclusion. Follow one stream. Inspect one record. Ask a better question. |

The map scene includes a brief tour of all twelve field-note cards. The named-site contexts and inventory records remain distinguished in the UI; story locations do not manufacture barrier classifications.

## Reproduce the recording

With the local app and model API running (`npm run dev:local`):

```sh
python scripts/assemble_video.py audio
node scripts/record_demo.mjs
python scripts/assemble_video.py assemble
```

Requires macOS `say`, FFmpeg, and the Playwright Chromium browser. Narration lives in `scripts/video_segments.json`. Outputs are `public/demo.mp4`, `public/demo.vtt`, and the existing accessible player `public/demo.html`. No external speech or LLM service is used.

The entrant can re-record this script in their own voice. Devpost submission and any eligibility attestation remain the entrant's responsibility; AI-assisted implementation and synthetic narration are disclosed here.
