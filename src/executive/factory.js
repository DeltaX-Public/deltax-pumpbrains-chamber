import { EXECUTIVE_MODES } from '../schemas/packets.js';
import { createStubExecutive } from './stub.js';
import { createDisabledExecutive } from './disabled.js';
import { createLocalRuntimeExecutive } from './localRuntime.js';

export function createExecutive(options = {}) {
  const mode = (options.mode || process.env.DELTAX_EXECUTIVE_MODE || 'stub').toLowerCase();
  if (!EXECUTIVE_MODES.includes(mode)) {
    throw new Error(`Unknown DELTAX_EXECUTIVE_MODE="${mode}". Allowed: ${EXECUTIVE_MODES.join(' | ')}`);
  }
  if (mode === 'stub') return createStubExecutive();
  if (mode === 'disabled') return createDisabledExecutive();

  const cmd = options.localRuntime?.cmd || process.env.DELTAX_LOCAL_RUNTIME_CMD || '';
  const args = options.localRuntime?.args ||
    (process.env.DELTAX_LOCAL_RUNTIME_ARGS
      ? process.env.DELTAX_LOCAL_RUNTIME_ARGS.split(/\s+/).filter(Boolean)
      : []);

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
