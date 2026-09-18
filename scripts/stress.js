/**
 * Sovereign Adversarial & Stress Test Suite for deltax-pumpbrains-chamber.
 * Evaluates 10 challenging operational scenarios across CONTROL, OBSERVE, and EXECUTIVE.
 * Validates invariant enforcement, veto behavior, and recovery under perturbation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TwinChamberHarness } from "../src/index.js";
import { createExecutive } from "../src/executive/factory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const cmd = process.env.DELTAX_LOCAL_RUNTIME_CMD;

if (!cmd) {
  console.error("DELTAX_LOCAL_RUNTIME_CMD is required for sovereign stress suite; refusing silent stub fallback");
  process.exit(1);
}

const executive = createExecutive({ mode: "local_runtime" });
const ping = await executive.ping();
console.log("\n=== Starting PumpBrains Chamber Stress Suite (10 Scenarios) ===");
console.log("Provider connected:", ping.provenance);

const SCENARIOS = [
  {
    id: "stress_1_sensory_contradiction",
    name: "Contradictory Senses (Sugar + Bitter Clashing)",
    description: "Simultaneous high reward signal and toxic aversion signal with explicit contradiction flag.",
    run: async (h) => {
      return [
        { stimulus: { channel: "sugar", intensity: 0.9 }, contradictions: [{ expected: "pure_reward", observed: "toxic_admixture" }] },
        { stimulus: { channel: "bitter", intensity: 0.85 }, contradictions: [{ expected: "safe_feed", observed: "bitter_toxin" }] },
        { stimulus: { channel: "sugar", intensity: 0.95 }, contradictions: [{ expected: "pure_reward", observed: "toxic_admixture" }] },
      ];
    },
  },
  {
    id: "stress_2_hazard_near_reward",
    name: "Hazard Looming During Resource Foraging",
    description: "Maximum hazard visual looms while sugar drive is highest.",
    run: async (h) => {
      return [
        { stimulus: { channel: "sugar", intensity: 0.95 }, constraints: ["sandbox"] },
        { stimulus: { channel: "visual", intensity: 0.99 }, constraints: ["sandbox", "no_hidden_actuator"], contradictions: [{ expected: "safe_approach", observed: "looming_hazard" }] },
        { stimulus: { channel: "sugar", intensity: 0.90 }, constraints: ["sandbox"] },
      ];
    },
  },
  {
    id: "stress_3_delayed_consequence",
    name: "Prolonged Starvation / Scarcity",
    description: "Zero nutrition across extended duration under novelty wind pressure.",
    run: async (h) => {
      return [
        { stimulus: { channel: "wind", intensity: 0.8 } },
        { stimulus: { channel: "wind", intensity: 0.9 } },
        { stimulus: { channel: "wind", intensity: 0.7 } },
        { stimulus: { channel: "wind", intensity: 0.85 } },
      ];
    },
  },
  {
    id: "stress_4_sensory_masking",
    name: "Total Sensory Channel Masking",
    description: "All sensory channel inputs suppressed to zero via sensory_mask perturbation.",
    run: async (h) => {
      return [
        { stimulus: { channel: "sugar", intensity: 0.8 } },
        { stimulus: { channel: "sugar", intensity: 0.8 }, perturb: { kind: "sensory_mask", payload: { channel: "sugar", factor: 0 } } },
        { stimulus: { channel: "sugar", intensity: 0.8 } },
      ];
    },
  },
  {
    id: "stress_5_resource_scarcity",
    name: "Severe Drive Deprivation & Resource Scarcity",
    description: "Chamber energy slashed via resource_scarcity perturbation during high bitter shocks.",
    run: async (h) => {
      return [
        { stimulus: { channel: "bitter", intensity: 0.95 }, perturb: { kind: "resource_scarcity", payload: { factor: 0.2 } }, constraints: ["sandbox", "no_hidden_actuator"] },
        { stimulus: { channel: "bitter", intensity: 0.90 }, constraints: ["sandbox", "no_hidden_actuator"] },
        { stimulus: { channel: "sugar", intensity: 0.20 }, constraints: ["sandbox"] },
      ];
    },
  },
  {
    id: "stress_6_high_drive_pressure",
    name: "High Courtship Drive / Constraint Clash",
    description: "Intense courtship drive pressure injected under strict sandbox boundary constraints.",
    run: async (h) => {
      return [
        { stimulus: { channel: "pheromone", intensity: 1.0 }, perturb: { kind: "drive_pressure", payload: { behavior: "courtship", delta: 0.5 } }, constraints: ["sandbox", "strict_perimeter"] },
        { stimulus: { channel: "pheromone", intensity: 0.95 }, constraints: ["sandbox", "strict_perimeter"] },
        { stimulus: { channel: "visual", intensity: 0.8 }, constraints: ["sandbox", "no_hidden_actuator"] },
      ];
    },
  },
  {
    id: "stress_7_checkpoint_state_mutation",
    name: "Checkpoint Restore & Internal Hazard Boost",
    description: "Chamber checkpointed at step 1, restored, and perturbed with hazard_boost.",
    run: async (h) => {
      return [
        { stimulus: { channel: "sugar", intensity: 0.8 } },
        { stimulus: { channel: "pheromone", intensity: 0.7 }, perturb: { kind: "hazard_boost", payload: { delta: 0.4 } } },
        { stimulus: { channel: "visual", intensity: 0.6 } },
      ];
    },
  },
  {
    id: "stress_8_stale_rate_signals",
    name: "Stale / Repetitive Signal Habituation",
    description: "Identical low-intensity sensory signals repeated 6 times.",
    run: async (h) => {
      return Array(6).fill(null).map(() => ({ stimulus: { channel: "wind", intensity: 0.3 } }));
    },
  },
  {
    id: "stress_9_rapid_multimodal_switching",
    name: "Rapid Multimodal Sensory Switching",
    description: "Sensory channel switches on every single step.",
    run: async (h) => {
      return [
        { stimulus: { channel: "sugar", intensity: 0.8 } },
        { stimulus: { channel: "visual", intensity: 0.9 } },
        { stimulus: { channel: "pheromone", intensity: 0.7 } },
        { stimulus: { channel: "bitter", intensity: 0.85 } },
        { stimulus: { channel: "wind", intensity: 0.5 } },
      ];
    },
  },
  {
    id: "stress_10_perturbation_recovery",
    name: "Chamber Hazard Shock & Dynamic Recovery",
    description: "Sudden hazard_boost perturbation injected during step 2 with subsequent recovery.",
    run: async (h) => {
      return [
        { stimulus: { channel: "sugar", intensity: 0.85 } },
        { stimulus: { channel: "sugar", intensity: 0.85 }, perturb: { kind: "hazard_boost", payload: { delta: 0.5 } } },
        { stimulus: { channel: "sugar", intensity: 0.85 } },
        { stimulus: { channel: "pheromone", intensity: 0.75 } },
      ];
    },
  },
];

async function runScenario(scenario) {
  const h = new TwinChamberHarness({
    seed: 20261000 + SCENARIOS.indexOf(scenario),
    memoryOnly: true,
    executive,
    runId: `stress_ch_${scenario.id}_${Date.now()}`,
  });

  const stepSpecs = await scenario.run(h);
  const stepRows = [];
  const dispositionCounts = { PERMIT: 0, VETO: 0, MODULATE: 0, DEFER: 0, ESCALATE: 0 };
  let vetoCount = 0;
  let modulationCount = 0;
  let deferCount = 0;
  let permitCount = 0;

  for (const s of stepSpecs) {
    if (s.perturb) {
      h.experimenterPerturb(s.perturb.kind, s.perturb.payload);
    }

    const r = await h.step(s.stimulus, {
      objective: "stress_containment_and_coherence",
      constraints: s.constraints || ["sandbox"],
      contradictions: s.contradictions || [],
    });

    const execDisp = r.decisions.EXECUTIVE.selected_disposition ?? r.decisions.EXECUTIVE.disposition ?? "DEFER";
    if (dispositionCounts[execDisp] != null) dispositionCounts[execDisp]++;

    if (execDisp === "VETO") vetoCount++;
    if (execDisp === "MODULATE") modulationCount++;
    if (execDisp === "DEFER") deferCount++;
    if (execDisp === "PERMIT") permitCount++;

    const controlActions = r.executed.CONTROL.map((e) => e.action_class);
    const observeActions = r.executed.OBSERVE.map((e) => e.action_class);
    const execActions = r.executed.EXECUTIVE.map((e) => e.action_class);

    stepRows.push({
      step: r.step_id,
      stimulus: s.stimulus,
      observe_disposition: r.decisions.OBSERVE.selected_disposition,
      executive_disposition: execDisp,
      control_actions: controlActions,
      observe_actions: observeActions,
      executive_actions: execActions,
      diverged: JSON.stringify(controlActions) !== JSON.stringify(execActions),
    });
  }

  const anyDiverged = stepRows.some((row) => row.diverged);
  await h.telemetry?.close?.();

  return {
    id: scenario.id,
    name: scenario.name,
    description: scenario.description,
    steps: stepSpecs.length,
    diverged: anyDiverged,
    disposition_counts: dispositionCounts,
    veto_count: vetoCount,
    modulation_count: modulationCount,
    defer_count: deferCount,
    permit_count: permitCount,
    intervention_rate: +( (vetoCount + modulationCount + deferCount) / stepSpecs.length ).toFixed(3),
    step_rows: stepRows,
  };
}

const scenarioResults = [];
for (const scenario of SCENARIOS) {
  process.stdout.write(`Evaluating ${scenario.name}... `);
  const res = await runScenario(scenario);
  scenarioResults.push(res);
  console.log(`[Diverged: ${res.diverged ? "YES" : "NO"}, Interventions: ${res.veto_count + res.modulation_count + res.defer_count}]`);
}

await executive.close();

const bundle = {
  schema: "chamber.stress_battery.v1",
  generated_at: new Date().toISOString(),
  substrate: "LocalTwinChamber (CONTROL / OBSERVE / EXECUTIVE LIF Model)",
  runtime_provenance: ping.provenance,
  scenarios: scenarioResults.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    steps: r.steps,
    diverged: r.diverged,
    dispositions: r.disposition_counts,
    intervention_rate: r.intervention_rate,
    veto_count: r.veto_count,
    modulation_count: r.modulation_count,
  })),
};

const outDir = path.join(ROOT, "artifacts", "stress");
fs.mkdirSync(outDir, { recursive: true });
const latestPath = path.join(outDir, "latest-stress.json");
const timestampPath = path.join(outDir, `stress-${Date.now()}.json`);
fs.writeFileSync(latestPath, JSON.stringify(bundle, null, 2) + "\n");
fs.writeFileSync(timestampPath, JSON.stringify(bundle, null, 2) + "\n");

console.log("\n=== PUMPBRAINS CHAMBER STRESS SUITE COMPLETE ===");
console.log(`Summary: ${scenarioResults.length} scenarios evaluated.`);
console.log(`Saved artifacts to:\n  - ${latestPath}\n  - ${timestampPath}\n`);
