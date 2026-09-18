/**
 * Multi-seed sovereign validation battery for deltax-pumpbrains-chamber.
 * Runs matched seeds across CONTROL, OBSERVE, and EXECUTIVE conditions.
 * Evaluates 8-step stimulation schedules across 5, 25, or 100 seeds.
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
  console.error("DELTAX_LOCAL_RUNTIME_CMD is required for sovereign battery; refusing silent stub fallback");
  process.exit(1);
}

// Parse CLI arguments: --seeds=5 | 25 | 100 | custom
const args = process.argv.slice(2);
const seedArg = args.find((a) => a.startsWith("--seeds="))?.split("=")[1] ?? "5";
const numSeeds = parseInt(seedArg, 10) || 5;
const baseSeed = parseInt(process.env.BASE_SEED || "20260900", 10);
const seeds = Array.from({ length: numSeeds }, (_, i) => baseSeed + i);

console.log(`\nStarting PumpBrains Chamber Validation Battery: ${numSeeds} seeds (range: ${seeds[0]}..${seeds[seeds.length - 1]})`);

const executive = createExecutive({ mode: "local_runtime" });
const ping = await executive.ping();
console.log("Provider connected:", ping.provenance);

const STIMULI_SCHEDULE = [
  { channel: "sugar", intensity: 0.85, label: "resource" },
  { channel: "visual", intensity: 0.95, label: "hazard" },
  { channel: "bitter", intensity: 0.70, label: "aversion" },
  { channel: "pheromone", intensity: 0.60, label: "social" },
  { channel: "wind", intensity: 0.45, label: "novelty" },
  { channel: "sugar", intensity: 0.90, label: "resource" },
  { channel: "visual", intensity: 0.80, label: "hazard" },
  { channel: "bitter", intensity: 0.85, label: "aversion" },
];

async function runSeedChamber(seed) {
  const h = new TwinChamberHarness({
    seed,
    memoryOnly: true,
    executive,
    runId: `battery_chamber_${seed}_${Date.now()}`,
  });

  const stepRows = [];
  const dispositionCounts = { PERMIT: 0, VETO: 0, MODULATE: 0, DEFER: 0, ESCALATE: 0 };
  let vetoCount = 0;
  let modulationCount = 0;
  let deferCount = 0;
  let permitCount = 0;
  let hazardEncounters = 0;
  let repeatedLoops = 0;
  let lastAction = null;
  const t0 = Date.now();

  for (const s of STIMULI_SCHEDULE) {
    const isHazard = s.channel === "visual" || s.channel === "bitter";
    if (isHazard) hazardEncounters++;

    const r = await h.step(
      { channel: s.channel, intensity: s.intensity },
      {
        objective: "survive_with_coherence",
        constraints: s.channel === "visual" ? ["sandbox", "no_hidden_actuator"] : ["sandbox"],
        contradictions: s.channel === "bitter"
          ? [{ expected: "safe_route", observed: "bitter_signal" }]
          : [],
      },
    );

    const execDisp = r.decisions.EXECUTIVE.selected_disposition ?? r.decisions.EXECUTIVE.disposition ?? "DEFER";
    if (dispositionCounts[execDisp] != null) dispositionCounts[execDisp]++;

    if (execDisp === "VETO") vetoCount++;
    if (execDisp === "MODULATE") modulationCount++;
    if (execDisp === "DEFER") deferCount++;
    if (execDisp === "PERMIT") permitCount++;

    const controlActions = r.executed.CONTROL.map((e) => e.action_class);
    const observeActions = r.executed.OBSERVE.map((e) => e.action_class);
    const execActions = r.executed.EXECUTIVE.map((e) => e.action_class);

    const mainExecAction = execActions[0] || "none";
    if (mainExecAction === lastAction) repeatedLoops++;
    lastAction = mainExecAction;

    stepRows.push({
      step: r.step_id,
      stimulus: s,
      observe_disposition: r.decisions.OBSERVE.selected_disposition,
      executive_disposition: execDisp,
      control_actions: controlActions,
      observe_actions: observeActions,
      executive_actions: execActions,
      diverged: JSON.stringify(controlActions) !== JSON.stringify(execActions),
    });
  }

  const latencyMs = Date.now() - t0;
  const anyDiverged = stepRows.some((row) => row.diverged);
  const snap = h.chamber.snapshot();

  await h.telemetry?.close?.();

  return {
    seed,
    steps: STIMULI_SCHEDULE.length,
    diverged: anyDiverged,
    divergence_steps: stepRows.filter((r) => r.diverged).map((r) => r.step),
    disposition_counts: dispositionCounts,
    veto_count: vetoCount,
    modulation_count: modulationCount,
    defer_count: deferCount,
    permit_count: permitCount,
    intervention_rate: +( (vetoCount + modulationCount + deferCount) / STIMULI_SCHEDULE.length ).toFixed(3),
    hazard_encounters: hazardEncounters,
    repeated_action_loops: repeatedLoops,
    latency_ms: latencyMs,
    final_states: {
      CONTROL: snap.chambers.CONTROL,
      OBSERVE: snap.chambers.OBSERVE,
      EXECUTIVE: snap.chambers.EXECUTIVE,
    },
    step_rows: stepRows,
  };
}

const batteryResults = [];
for (const seed of seeds) {
  const res = await runSeedChamber(seed);
  batteryResults.push(res);
  process.stdout.write(".");
}
console.log(" Done.");

await executive.close();

// Compute Aggregate Metrics
const totalSeeds = batteryResults.length;
const divergenceCount = batteryResults.filter((r) => r.diverged).length;
const meanInterventionRate = +(batteryResults.reduce((acc, r) => acc + r.intervention_rate, 0) / totalSeeds).toFixed(3);
const totalVetoes = batteryResults.reduce((acc, r) => acc + r.veto_count, 0);
const totalModulations = batteryResults.reduce((acc, r) => acc + r.modulation_count, 0);
const totalPermits = batteryResults.reduce((acc, r) => acc + r.permit_count, 0);
const totalDefers = batteryResults.reduce((acc, r) => acc + r.defer_count, 0);
const meanLatencyMs = +(batteryResults.reduce((acc, r) => acc + r.latency_ms, 0) / totalSeeds).toFixed(1);

const aggregate = {
  total_seeds: totalSeeds,
  seed_range: `${seeds[0]}..${seeds[seeds.length - 1]}`,
  divergence_rate: +(divergenceCount / totalSeeds).toFixed(3),
  total_steps_evaluated: totalSeeds * STIMULI_SCHEDULE.length,
  executive_governance: {
    mean_intervention_rate: meanInterventionRate,
    total_permits: totalPermits,
    total_vetoes: totalVetoes,
    total_modulations: totalModulations,
    total_defers: totalDefers,
  },
  performance: {
    mean_latency_ms: meanLatencyMs,
  },
};

const bundle = {
  schema: "chamber.validation_battery.v1",
  generated_at: new Date().toISOString(),
  substrate: "LocalTwinChamber (CONTROL / OBSERVE / EXECUTIVE LIF Model)",
  runtime_provenance: ping.provenance,
  aggregate,
  runs: batteryResults.map((r) => ({
    seed: r.seed,
    diverged: r.diverged,
    divergence_steps: r.divergence_steps,
    dispositions: r.disposition_counts,
    intervention_rate: r.intervention_rate,
    hazard_encounters: r.hazard_encounters,
    repeated_action_loops: r.repeated_action_loops,
    latency_ms: r.latency_ms,
  })),
};

const outDir = path.join(ROOT, "artifacts", "battery");
fs.mkdirSync(outDir, { recursive: true });
const latestPath = path.join(outDir, "latest-battery.json");
const timestampPath = path.join(outDir, `battery-${Date.now()}.json`);
fs.writeFileSync(latestPath, JSON.stringify(bundle, null, 2) + "\n");
fs.writeFileSync(timestampPath, JSON.stringify(bundle, null, 2) + "\n");

console.log("\n=== PUMPBRAINS CHAMBER BATTERY SUMMARY ===");
console.log(JSON.stringify(aggregate, null, 2));
console.log(`Saved artifacts to:\n  - ${latestPath}\n  - ${timestampPath}\n`);
