import { loadRegistry } from '../utils/registry-loader.mjs';

const registry = await loadRegistry();
const { projects } = registry;

console.log(`\nWowwi Project Registry  (${projects.length} project${projects.length === 1 ? '' : 's'})`);
console.log('─'.repeat(60));

for (const p of projects) {
  console.log(`\n  ${p.projectId}`);
  console.log(`    Name:     ${p.displayName}`);
  console.log(`    Status:   ${p.status}`);
  console.log(`    Networks: ${p.supportedNetworks.join(', ')}`);
  console.log(`    Folder:   ${p.folder}`);
  if (p.formalSolvability) {
    console.log(`    Solvability: ${p.formalSolvability}`);
  }
}

console.log('');
