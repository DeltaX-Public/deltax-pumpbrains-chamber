import { PumpBrainsClient } from '../src/index.js';
const client = new PumpBrainsClient();
const species = await client.listSpecies();
const mosca = species.find((s) => s.id === 'mosca') || (await client.getSpecies('mosca'));
console.log(JSON.stringify({
  ids: species.map((s) => s.id),
  mosca_channels: Object.keys(mosca.channels || {}),
  mosca_behaviors: Object.keys(mosca.behaviors || {}),
}, null, 2));
