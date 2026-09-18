import { mkdir, appendFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export class TelemetryRecorder {
  constructor(opts = {}) {
    this.dir = opts.dir || process.env.TELEMETRY_DIR || './telemetry-out';
    this.runId = opts.runId || `run_${Date.now()}`;
    this.memoryOnly = opts.memoryOnly === true;
    this.events = [];
    this.ready = null;
  }

  async #ensure() {
    if (this.memoryOnly) return;
    if (!this.ready) this.ready = mkdir(this.dir, { recursive: true });
    await this.ready;
  }

  async record(type, payload = {}) {
    const event = { type, run_id: this.runId, timestamp: new Date().toISOString(), ...payload };
    this.events.push(event);
    if (!this.memoryOnly) {
      await this.#ensure();
      await appendFile(join(this.dir, `${this.runId}.jsonl`), JSON.stringify(event) + '\n', 'utf8');
    }
    return event;
  }

  async flushSummary(summary) {
    if (this.memoryOnly) return summary;
    await this.#ensure();
    await writeFile(join(this.dir, `${this.runId}.summary.json`), JSON.stringify(summary, null, 2), 'utf8');
    return summary;
  }

  filter(type) { return this.events.filter((e) => e.type === type); }
}
