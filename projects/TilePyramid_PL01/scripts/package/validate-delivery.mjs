import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateDeliveryPackage } from './delivery-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const deliveryRoot = path.join(root, 'delivery/latest');

const validation = await validateDeliveryPackage(deliveryRoot);
await writeFile(
  path.join(deliveryRoot, 'delivery-validation-report.json'),
  JSON.stringify(validation, null, 2)
).catch(() => {});

console.log(`Delivery validation: ${validation.status}`);
for (const warning of validation.warnings) console.log(`  WARNING: ${warning}`);
for (const error of validation.errors) console.log(`  ERROR: ${error}`);

if (validation.status !== 'PASS') {
  process.exitCode = 1;
}
