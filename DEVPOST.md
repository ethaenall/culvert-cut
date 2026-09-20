# Culvert Cut

**A WRIA 8 map of real fish-passage barriers, with explanations tied to official evidence.**

## Inspiration

A crossing can look ordinary from the road and still matter enormously to a fish. Around Lake Sammamish, small streams connect neighborhoods to spawning habitat, yet the information explaining those connections is scattered across inventories, restoration reports, and water-quality assessments. The historical 2017–18 kokanee return of fewer than twenty adults makes that disconnect especially tangible. It is a historical warning, not a claim about today's population.

Earth Forward led us to a deliberately local question: could a resident understand one crossing in under a minute and leave with a useful question for public works? We chose the Lake Washington–Cedar–Sammamish basin, WRIA 8, and kept the product focused on passage, habitat, and water quality.

## What it does

Culvert Cut is a dark, cartographic single-page application. Its bundled snapshot contains 1,931 real WDFW site records in WRIA 8. Users can filter for barriers, recorded fish use, culverts, or crossings within five kilometers of their location. Shape and color distinguish total barriers, partial barriers, passable sites, and unknown conditions.

Selecting a crossing reveals its Site ID, stream, feature type, owner type, survey date, and available inventory fields. Missing information remains visible as unknown. A resident can copy a three-sentence public-works briefing, open the official report, or queue a mock photo report locally without sending anything.

Additional layers show modeled coho habitat access and Ecology's 303(d) assessment areas. Twelve field notes introduce Zackuse Creek, Juanita Creek, the Sammamish River, driveway culverts, and highway versus city ownership. Story-only locations are labeled illustrative; they never become invented inventory records.

Ask this basin retrieves official site fields and source snippets, then produces citation-backed explanations. The working default uses deterministic templates. A demo-rain toggle illustrates a clearly labeled first-flush heuristic, with no chemical sensor or live concentration claim.

## How we built it

The frontend uses Vite, React, TypeScript, and MapLibre GL. A Python pipeline queries ArcGIS object IDs, downloads bounded chunks, preserves source properties, and bundles GeoJSON so a failed service does not stop the presentation. We fetched King County's `wtrcrs_line`, `fp_cohointrinsicpotential_line`, and `fp_fishpassagesites_point`, alongside WDFW passage records and Ecology assessment geometry. County points are retained for inspection, without an unverified cross-inventory merge.

The Fish Passage Inventory, Assessment, and Prioritization Manual, published by WDFW in 2019, provides the assessment context. Habitat potential, passage at one structure, and access through an entire network are treated as different questions.

The model deliverable includes 3,027 instruction examples and forty site-disjoint validation examples. Training code uses Qwen2.5-0.5B-Instruct, PEFT LoRA, and TRL SFTTrainer, with rank sixteen, alpha thirty-two, and a maximum sequence length of 768. Optional local inference uses retrieved context and an extractive output gate. No external LLM API is called. No adapter training or model improvement is claimed for this delivery; the CPU-supported template path is the running demo.

## Challenges

The hardest problem was deciding what the data could actually support. A fish-use field does not establish a direct observation. A passable crossing does not prove an unobstructed route upstream. Nearby impairment geometry is not enough to assert that a specific crossing is listed. We left those joins unknown instead of hiding the gaps behind confident language.

Retrieval also needed testing. Loose substring matching could connect an unrelated question to part of a road name. Token-based matching made refusal behavior more reliable. Official identifiers sometimes contain spaces, which also shaped the held-out identifier checks.

## Accomplishments

The result is a usable map with real records, functioning filters, official links, source chips, and a specific resident action. It demonstrates the relationship between pipes, hot water, and runoff without turning them into a fabricated environmental score. The complete application runs without a GPU or model service.

The training dataset and evaluation pipeline are reproducible. Template checks cover forty held-out sites, while separate application checks exercise retrieval, filtering, and advisory logic. Those checks are not presented as evidence of trained-model accuracy.

## What we learned

Environmental software becomes more useful when uncertainty is part of the interface. Showing “unknown” can be more informative than a polished but unsupported answer. We also learned that citation formatting alone does not guarantee grounding; optional generated text needs validation against the actual retrieved evidence.

This was a new, AI-assisted build. The implementation, datasets, tests, and drafts were created during the project, with that assistance documented transparently.

## What's next

Next steps are a reviewed upstream-network join, a verified site-to-assessment intersection, and local adapter training followed by factual evaluation beyond identifier checks. We would seek feedback from watershed practitioners and residents before expanding reporting or interpretation. The immediate invitation is simple: follow one stream, inspect one official record, and ask a better question about what comes next.
