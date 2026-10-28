import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2]);
const sourceRoot = path.join(root, 'src');
const extensions = ['.js', '.jsx', '.mjs', '.ts', '.tsx', '.css', '.json', '.webp', '.jpeg', '.jpg', '.png', '.svg', '.MP4'];
const sourceFiles = new Set();

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else sourceFiles.add(fullPath);
  }
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, ...extensions.map((extension) => `${base}${extension}`), ...extensions.map((extension) => path.join(base, `index${extension}`))];
  return candidates.find((candidate) => sourceFiles.has(candidate)) || null;
}

walk(sourceRoot);
const visited = new Set();
const queue = [path.join(sourceRoot, 'main.jsx'), path.join(sourceRoot, 'services', 'appUpdate.test.js')];
const importPattern = /(?:import\s*(?:[^'"()]*?\s*from\s*)?|import\s*\(|export\s+[^'"()]*?\s+from\s*)['"]([^'"]+)['"]/g;

while (queue.length) {
  const file = queue.pop();
  if (!file || visited.has(file) || !sourceFiles.has(file)) continue;
  visited.add(file);
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(importPattern)) {
    const target = resolveImport(file, match[1]);
    if (target && !visited.has(target)) queue.push(target);
  }
}

for (const file of [...sourceFiles].filter((file) => !visited.has(file)).sort()) {
  console.log(path.relative(root, file));
}
