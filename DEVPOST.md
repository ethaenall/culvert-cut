# Culvert Cut

**Can the evidence carry the claim? A locally trained fish-passage specialist that makes its sources—and its mistakes—inspectable.**

## Inspiration

“This culvert is passable” sounds reassuring. “Fish can reach every upstream spawning reach” sounds like the next logical sentence. But one official crossing record does not establish connectivity through an entire stream network. That small leap between a fact and a conclusion became our focus.

Around Lake Sammamish, culverts, warm water, and runoff affect the same connected habitat. The historical 2017–18 kokanee return of fewer than twenty adults makes the stakes tangible. We wanted an Earth Forward project that helps residents read local evidence carefully and ask a useful question about restoration, while giving judges a real machine-learning experiment they can inspect.

## What it does

Culvert Cut opens with an interactive Evidence lab. A visitor reads a claim beside the exact official record supplied to the model. They choose supported, contradicted, or not established, then reveal the base and trained model responses side by side. Every test case remains available, including the specialist's failures. Raw outputs, citations, and downloadable evidence briefs make the comparison inspectable. A source-linked public-works question turns the check into a concrete next step.

The public site contains clearly labeled recordings of actual model generations. A local mode runs new claims against any bundled site using the trained adapter, without an external language-model API. Its outputs remain interpretations of inventory evidence, not agency determinations.

The basin map contains 1,931 real WDFW WRIA 8 records. Residents can filter barriers, recorded fish use, culverts, and nearby crossings; open original reports; copy a public-works briefing; and explore twelve field notes. Habitat and water-quality overlays show why one crossing is only part of the picture. Mock photo queuing stays on the device, and the first-flush reminder is explicitly a canned weather heuristic.

## How we built it

The application uses Vite, React, TypeScript, and MapLibre GL. A reproducible Python pipeline downloads official ArcGIS records into bundled GeoJSON. Sources include WDFW fish-passage sites, Ecology's 303(d) assessment areas, and King County's `wtrcrs_line`, `fp_cohointrinsicpotential_line`, and `fp_fishpassagesites_point` layers.

The WDFW Fish Passage Inventory, Assessment, and Prioritization Manual, published in 2019, supplies assessment context. We preserve distinctions between fish use and observation, habitat potential and occupancy, and individual passability and network access.

We fine-tuned Qwen2.5-1.5B-Instruct locally on an Apple M5 Pro using MLX. The rank-sixteen LoRA run completed 770 steps over a 3,078-example training set, with approximately 11.1 gigabytes of peak memory. The adapter is included in the repository. A separate CUDA PEFT and TRL training path is also supplied.

## Challenges

The central challenge was proving that training changed model behavior instead of merely adding a badge. We reserved forty unseen Site IDs for 120 claim-audit cases and another twenty sites for validation. Both models received identical context and instructions. We retained one raw greedy generation per case, without template repair or retries contributing to the score.

Citation formatting was another lesson. The base model returned empty arrays or source URLs instead of the requested Site ID strings. We report that as a format failure, separately from verdict correctness; it would be misleading to say those outputs contained no citations.

An earlier half-billion-parameter experiment exposed weak explanations. We revised the training wording and used a 1.5B base, excluding the original test sites and reserving forty fresh sites for the final evaluation.

Data gaps also mattered. We could not establish a verified upstream-network or site-to-303(d) join from the available snapshot. Those gaps remain visible rather than becoming confident model claims.

## Accomplishments

On our narrow, rule-labeled benchmark, correct verdicts increased from 40 of 120 for the base model to 116 of 120 after training: 33.3 percent to 96.7 percent. The adapter followed the required citation-array format in all 120 cases. All four wrong verdicts are public, and visitors can filter directly to them.

A separate forty-site explainer check found no invented Site IDs or missing expected citations. This is an identifier result, not proof that every generated explanation is correct. The working product combines those measured outcomes with official evidence, an accessible map, and a practical resident briefing.

## What we learned

Small models can learn useful evidence-handling behavior, but a compelling score needs a precise definition. Our examples and reference labels are programmatic, not expert annotations, and held-out wording still belongs to related task families. Publishing the context and mistakes makes those limits easier to understand.

This was a new, AI-assisted build. We also learned that “no CUDA” does not mean “no GPU”: using Apple silicon made actual local training possible.

## What's next

Next steps are independent practitioner review, more varied claim benchmarks, verified spatial and stream-network joins, and evaluation of explanation correctness beyond labels. Our immediate invitation is simpler: inspect one crossing, challenge one conclusion, and follow the evidence before acting.
