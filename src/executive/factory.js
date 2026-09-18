import { EXECUTIVE_MODES } from '../schemas/packets.js';
import { createStubExecutive } from './stub.js';
import { createDisabledExecutive } from './disabled.js';
import { createLocalRuntimeExecutive } from './localRuntime.js';

function resolveMode(options = {}) {
  return (
    options.mode ||
    process.env.DELTAX_EXECUTIVE ||
    process.env.DELTAX_EXECUTIVE_MODE ||
    'stub'
  ).toLowerCase();
}

function resolveLocalRuntimeCmd(options = {}) {
  if (options.localRuntime && Object.prototype.hasOwnProperty.call(options.localRuntime, 'cmd')) {
    return {
      cmd: options.localRuntime.cmd || '',
      args: Array.isArray(options.localRuntime.args) ? options.localRuntime.args : [],
    };
  }
  const raw = process.env.DELTAX_LOCAL_RUNTIME_CMD || '';
  if (!raw.trim()) return { cmd: '', args: [] };
  if (process.env.DELTAX_LOCAL_RUNTIME_ARGS) {
    return {
      cmd: raw.trim(),
      args: process.env.DELTAX_LOCAL_RUNTIME_ARGS.split(/\s+/).filter(Boolean),
    };
  }
  // Allow a full command string, e.g. "/path/python -m deltax_runtime.provider"
  const parts = raw.trim().match(/(?:[^\s"]+|"[^"]*")+/g)?.map((p) => p.replace(/^"|"$/g, '')) ?? [];
  return { cmd: parts[0] || '', args: parts.slice(1) };
}

export function createExecutive(options = {}) {
  const mode = resolveMode(options);
  if (!EXECUTIVE_MODES.includes(mode)) {
    throw new Error(`Unknown DELTAX_EXECUTIVE="${mode}". Allowed: ${EXECUTIVE_MODES.join(' | ')}`);
  }
  if (mode === 'stub') return createStubExecutive();
  if (mode === 'disabled') return createDisabledExecutive();

  const { cmd, args } = resolveLocalRuntimeCmd(options);
  try {
    return createLocalRuntimeExecutive({ cmd, args, timeoutMs: options.localRuntime?.timeoutMs });
  } catch (e) {
    if (e.code === 'LOCAL_RUNTIME_UNAVAILABLE') throw e;
    throw Object.assign(
      new Error(`local_runtime unavailable: ${e.message}. Refusing silent stub fallback.`),
      { code: 'LOCAL_RUNTIME_UNAVAILABLE', cause: e },
    );
  }
}

export { createStubExecutive, createDisabledExecutive, createLocalRuntimeExecutive };
