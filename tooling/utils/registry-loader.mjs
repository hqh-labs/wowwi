import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // tooling/utils/
const TOOLING_ROOT = path.dirname(HERE); // tooling/
const DEFAULT_REPO_ROOT = path.dirname(TOOLING_ROOT); // wowwi/
const DEFAULT_REGISTRY_PATH = path.join(TOOLING_ROOT, 'project-registry/projects.json');

export const REPO_ROOT = process.env.WOWWI_REPO_ROOT
  ? path.resolve(process.env.WOWWI_REPO_ROOT)
  : DEFAULT_REPO_ROOT;
export const REGISTRY_PATH = process.env.WOWWI_REGISTRY_PATH
  ? path.resolve(process.env.WOWWI_REGISTRY_PATH)
  : DEFAULT_REGISTRY_PATH;

export async function loadRegistry() {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  return JSON.parse(text);
}
