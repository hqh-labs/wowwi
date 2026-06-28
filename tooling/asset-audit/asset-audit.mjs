import { access, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const IGNORED_FILE_NAMES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini', '.gitkeep']);

export const CATEGORY_EXTENSIONS = {
  image: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac'],
  video: ['.mp4', '.mov', '.webm'],
  data: ['.json', '.csv', '.txt', '.xml'],
  font: ['.ttf', '.otf', '.woff', '.woff2'],
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  'design-source': ['.psd', '.ai', '.fig', '.sketch'],
  code: ['.js', '.ts', '.html', '.css'],
};

const EXTENSION_TO_CATEGORY = new Map(
  Object.entries(CATEGORY_EXTENSIONS).flatMap(([category, exts]) =>
    exts.map(ext => [ext, category])
  )
);

export function parseAuditArgs(argv) {
  const result = { projectId: null, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--project') {
      result.projectId = argv[++i] ?? '';
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return result;
}

export function classifyExtension(fileName) {
  const lower = fileName.toLowerCase();
  const ext = path.extname(lower);
  if (lower.endsWith('.tar.gz')) {
    return { extension: '.tar.gz', category: 'archive' };
  }
  return {
    extension: ext || '(none)',
    category: EXTENSION_TO_CATEGORY.get(ext) ?? 'unknown',
  };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function resolveIntakeFolders({ repoRoot, project }) {
  const folders = [];
  const projectRoot = path.join(repoRoot, project.folder);

  for (const rel of [
    'input/raw-assets',
    'input/extracted-assets',
    'input/references',
    'input/brief',
  ]) {
    folders.push({
      label: rel,
      path: path.join(projectRoot, rel),
      source: 'project',
    });
  }

  if (project.projectId === 'TilePyramid_PL01') {
    folders.push(
      {
        label: 'project-input/raw-assets',
        path: path.join(repoRoot, 'project-input/raw-assets'),
        source: 'legacy',
      },
      {
        label: 'project-input/extracted-assets',
        path: path.join(repoRoot, 'project-input/extracted-assets'),
        source: 'legacy',
      },
      {
        label: 'project-input/references',
        path: path.join(repoRoot, 'project-input/references'),
        source: 'legacy',
      }
    );
  }

  return folders;
}

async function scanFolder(folder, repoRoot) {
  const files = [];
  const existsFlag = await exists(folder.path);
  if (!existsFlag) {
    return { ...folder, exists: false, files };
  }

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }
      if (!entry.isFile() || IGNORED_FILE_NAMES.has(entry.name)) {
        continue;
      }
      const stat = await lstat(fullPath);
      const { extension, category } = classifyExtension(entry.name);
      files.push({
        name: entry.name,
        path: path.relative(repoRoot, fullPath).replace(/\\/g, '/'),
        folder: folder.label,
        extension,
        category,
        sizeBytes: stat.size,
      });
    }
  }

  await walk(folder.path);
  return { ...folder, exists: true, files };
}

function addSummary(summary, key, sizeBytes) {
  if (!summary[key]) {
    summary[key] = { count: 0, bytes: 0 };
  }
  summary[key].count += 1;
  summary[key].bytes += sizeBytes;
}

async function enrichFileMetadata(file, repoRoot) {
  const fullPath = path.join(repoRoot, file.path);
  if (file.extension === '.json') {
    try {
      const parsed = JSON.parse(await readFile(fullPath, 'utf8'));
      return {
        ...file,
        json: {
          valid: true,
          topLevelType: Array.isArray(parsed) ? 'array' : typeof parsed,
        },
      };
    } catch (err) {
      return {
        ...file,
        json: {
          valid: false,
          error: err.message,
        },
      };
    }
  }
  if (file.extension === '.png') {
    const dims = await readPngDimensions(fullPath);
    if (dims) return { ...file, image: dims };
  }
  return file;
}

async function readPngDimensions(fullPath) {
  const handle = await import('node:fs/promises').then(fs => fs.open(fullPath, 'r')).catch(() => null);
  if (!handle) return null;
  try {
    const buffer = Buffer.alloc(24);
    await handle.read(buffer, 0, 24, 0);
    const signature = buffer.subarray(0, 8).toString('hex');
    if (signature !== '89504e470d0a1a0a') return null;
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
      format: 'png',
    };
  } finally {
    await handle.close();
  }
}

function buildWarnings({ files, scannedFolders, totals, archives, duplicateNames }) {
  const warnings = [];
  if (totals.fileCount === 0) {
    warnings.push('No intake assets found.');
  }
  for (const folder of scannedFolders) {
    if (!folder.exists) {
      warnings.push(`Missing intake folder: ${folder.label}`);
    } else if (folder.fileCount === 0) {
      warnings.push(`Empty intake folder: ${folder.label}`);
    }
  }
  for (const file of files) {
    if (file.sizeBytes > 10 * 1024 * 1024) {
      warnings.push(`Very large source file: ${file.path} (${file.sizeBytes} bytes)`);
    }
    if (file.category === 'unknown') {
      warnings.push(`Unsupported or unknown extension: ${file.path}`);
    }
    if (file.extension === '.png' && file.sizeBytes > 1024 * 1024) {
      warnings.push(`Large PNG should be optimized before runtime use: ${file.path}`);
    }
    if ((file.category === 'audio' || file.category === 'video') && file.sizeBytes > 3 * 1024 * 1024) {
      warnings.push(`Large ${file.category} file may need runtime optimization: ${file.path}`);
    }
  }
  if (archives.length > 0) {
    const extractedHasFiles = scannedFolders.some(folder =>
      folder.label.includes('extracted-assets') && folder.fileCount > 0
    );
    if (!extractedHasFiles) {
      warnings.push('Source archive present but no extracted assets were found.');
    }
  }
  for (const dup of duplicateNames) {
    warnings.push(`Duplicate filename detected: ${dup.name} (${dup.paths.length} files)`);
  }
  if (totals.totalBytes > 20 * 1024 * 1024) {
    warnings.push('Total source asset size is high; runtime copies will need optimization.');
  }
  return warnings;
}

function buildRecommendations({ totals, archives }) {
  const recommendations = [
    'Keep raw and extracted client assets immutable.',
    'Create runtime copies before optimizing, resizing, or converting assets.',
    'Document source ownership, intended use, and checksums in ASSET_INTAKE.md.',
    'Optimize images and audio before adding them to runtime bundles.',
  ];
  if (archives.length > 0) {
    recommendations.push('If an archive is the only source, extract it outside the raw folder and document the extracted contents.');
  }
  if (totals.fileCount === 0) {
    recommendations.push('Add client source assets to the project intake folders before implementation planning.');
  }
  recommendations.push('Record logo, icon, CTA, store URL, and target-network notes in the project brief.');
  return recommendations;
}

export async function buildAssetAudit({ repoRoot, project, now = new Date() }) {
  const intakeFolders = resolveIntakeFolders({ repoRoot, project });
  const scanned = [];
  for (const folder of intakeFolders) {
    scanned.push(await scanFolder(folder, repoRoot));
  }

  const rawFiles = scanned.flatMap(folder => folder.files);
  const files = [];
  for (const file of rawFiles) {
    files.push(await enrichFileMetadata(file, repoRoot));
  }

  const categories = {};
  const extensions = {};
  let totalBytes = 0;
  for (const file of files) {
    totalBytes += file.sizeBytes;
    addSummary(categories, file.category, file.sizeBytes);
    addSummary(extensions, file.extension, file.sizeBytes);
  }

  const largestFiles = [...files].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 10);
  const archives = files.filter(file => file.category === 'archive');
  const jsonFiles = files.filter(file => file.extension === '.json');
  const nameMap = new Map();
  for (const file of files) {
    const key = file.name.toLowerCase();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key).push(file.path);
  }
  const duplicateNames = [...nameMap.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([name, paths]) => ({ name, paths }));

  const scannedFolders = scanned.map(folder => ({
    label: folder.label,
    path: path.relative(repoRoot, folder.path).replace(/\\/g, '/'),
    source: folder.source,
    exists: folder.exists,
    fileCount: folder.files.length,
    totalBytes: folder.files.reduce((sum, file) => sum + file.sizeBytes, 0),
  }));

  const totals = {
    fileCount: files.length,
    totalBytes,
  };
  const warnings = buildWarnings({ files, scannedFolders, totals, archives, duplicateNames });
  const recommendations = buildRecommendations({ totals, archives });

  return {
    projectId: project.projectId,
    displayName: project.displayName,
    generatedAt: now.toISOString(),
    scannedFolders,
    totals,
    categories,
    extensions,
    largestFiles,
    archives,
    jsonFiles,
    duplicateNames,
    warnings,
    recommendations,
    rawAssetsModified: false,
  };
}

function fmtBytes(n) {
  return `${n.toLocaleString()} bytes`;
}

function summaryRows(summary) {
  return Object.entries(summary)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `| ${key} | ${value.count} | ${fmtBytes(value.bytes)} |`)
    .join('\n');
}

function fileRows(files, extra = () => '') {
  if (files.length === 0) return '| None | - | - | - |';
  return files
    .map(file => `| \`${file.path}\` | ${file.category} | ${fmtBytes(file.sizeBytes)} | ${extra(file)} |`)
    .join('\n');
}

export function renderAssetAuditMarkdown(audit) {
  const warnings = audit.warnings.length
    ? audit.warnings.map(warning => `- ${warning}`).join('\n')
    : '- None';
  const recommendations = audit.recommendations.map(item => `- ${item}`).join('\n');
  const folders = audit.scannedFolders
    .map(folder => `- \`${folder.path}\` (${folder.exists ? `${folder.fileCount} files` : 'missing'})`)
    .join('\n');
  const jsonTable = audit.jsonFiles.length
    ? audit.jsonFiles
        .map(file => `| \`${file.path}\` | ${file.json?.valid ? 'valid' : 'invalid'} | ${file.json?.topLevelType ?? file.json?.error ?? '-'} |`)
        .join('\n')
    : '| None | - | - |';

  return `# Asset Audit

Project ID: \`${audit.projectId}\`
Display name: ${audit.displayName}
Generated: \`${audit.generatedAt}\`

## Intake Folders Scanned

${folders}

## Totals

- Total files: ${audit.totals.fileCount}
- Total bytes: ${fmtBytes(audit.totals.totalBytes)}

## Category Summary

| Category | Files | Bytes |
|---|---:|---:|
${summaryRows(audit.categories) || '| None | 0 | 0 bytes |'}

## Extension Summary

| Extension | Files | Bytes |
|---|---:|---:|
${summaryRows(audit.extensions) || '| None | 0 | 0 bytes |'}

## Largest Files

| File | Category | Bytes | Notes |
|---|---|---:|---|
${fileRows(audit.largestFiles, file => file.image ? `${file.image.width}x${file.image.height}` : '-')}

## Archive Files

| File | Category | Bytes | Notes |
|---|---|---:|---|
${fileRows(audit.archives)}

## JSON Files

| File | Parse status | Top-level type / error |
|---|---|---|
${jsonTable}

## Duplicate Filenames

${audit.duplicateNames.length ? audit.duplicateNames.map(dup => `- ${dup.name}: ${dup.paths.map(p => `\`${p}\``).join(', ')}`).join('\n') : '- None'}

## Warnings

${warnings}

## Recommendations

${recommendations}

## Raw Asset Safety Note

The analyzer read intake files only. It did not modify, move, rename, delete,
recompress, or overwrite raw or extracted client assets.

## Next Steps

- Review warnings before selecting runtime assets.
- Create runtime copies before optimization or conversion.
- Keep source assets in intake folders immutable.
- Update project brief notes for required logo, icon, CTA, store URLs, and target networks.

## Raw Assets Modified

\`${audit.rawAssetsModified}\`
`;
}

export async function writeAssetAudit({ repoRoot, project, audit }) {
  const docsDir = path.join(repoRoot, project.folder, 'docs');
  await mkdir(docsDir, { recursive: true });
  const markdownPath = path.join(docsDir, 'ASSET_AUDIT.md');
  const jsonPath = path.join(docsDir, 'asset-audit.json');
  await writeFile(markdownPath, renderAssetAuditMarkdown(audit), 'utf8');
  await writeFile(jsonPath, `${JSON.stringify(audit, null, 2)}\n`, 'utf8');
  return { markdownPath, jsonPath };
}

export async function runAssetAudit({ repoRoot, project, dryRun = false, now = new Date() }) {
  const audit = await buildAssetAudit({ repoRoot, project, now });
  if (dryRun) {
    return { audit, written: false, paths: null };
  }
  const paths = await writeAssetAudit({ repoRoot, project, audit });
  return { audit, written: true, paths };
}

export async function validateAssetAudit({ repoRoot, project }) {
  const docsDir = path.join(repoRoot, project.folder, 'docs');
  const markdownPath = path.join(docsDir, 'ASSET_AUDIT.md');
  const jsonPath = path.join(docsDir, 'asset-audit.json');
  const errors = [];

  if (!await exists(markdownPath)) errors.push('ASSET_AUDIT.md not found');
  if (!await exists(jsonPath)) {
    errors.push('asset-audit.json not found');
    return { pass: false, errors, markdownPath, jsonPath, audit: null };
  }

  let audit = null;
  try {
    audit = JSON.parse(await readFile(jsonPath, 'utf8'));
  } catch (err) {
    errors.push(`asset-audit.json is not valid JSON: ${err.message}`);
    return { pass: false, errors, markdownPath, jsonPath, audit: null };
  }

  if (audit.projectId !== project.projectId) {
    errors.push(`projectId mismatch: expected ${project.projectId}, got ${audit.projectId}`);
  }
  if (audit.rawAssetsModified !== false) {
    errors.push('rawAssetsModified must be false');
  }
  if (!audit.totals || typeof audit.totals.fileCount !== 'number' || typeof audit.totals.totalBytes !== 'number') {
    errors.push('totals must include numeric fileCount and totalBytes');
  }
  if (!Array.isArray(audit.scannedFolders) || audit.scannedFolders.length === 0) {
    errors.push('scannedFolders must be a non-empty array');
  }
  if (!Array.isArray(audit.warnings)) {
    errors.push('warnings must be an array');
  }
  if (!Array.isArray(audit.recommendations)) {
    errors.push('recommendations must be an array');
  }
  const categoryCount = Object.values(audit.categories ?? {}).reduce((sum, value) => sum + (value.count ?? 0), 0);
  if (audit.totals && categoryCount !== audit.totals.fileCount) {
    errors.push('category counts do not match total file count');
  }

  return { pass: errors.length === 0, errors, markdownPath, jsonPath, audit };
}

