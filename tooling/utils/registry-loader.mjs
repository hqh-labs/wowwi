import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // tooling/utils/
const TOOLING_ROOT = path.dirname(HERE); // tooling/
export const REPO_ROOT = path.dirname(TOOLING_ROOT); // wowwi/
export const REGISTRY_PATH = path.join(TOOLING_ROOT, 'project-registry/projects.json');

export async function loadRegistry() {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  return JSON.parse(text);
}
