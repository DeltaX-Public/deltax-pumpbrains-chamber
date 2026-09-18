import { EXECUTIVE_SOURCES } from '../schemas/packets.js';

export function createDisabledExecutive() {
  return {
    mode: 'disabled',
    executive_source: EXECUTIVE_SOURCES.disabled,
    genuine_deltax: false,
    async evaluate() {
      const err = new Error(
        'DeltaX executive mode is disabled. Set DELTAX_EXECUTIVE_MODE=stub or local_runtime.',
      );
      err.code = 'DELTAX_DISABLED';
      throw err;
    },
    async close() {},
  };
}
