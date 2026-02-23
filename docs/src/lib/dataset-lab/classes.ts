import { readFile, writeFile } from 'node:fs/promises';
import YAML from 'yaml';
import type { ClassDef } from './types';
import { datasetClassesPath, ensureDatasetDirs } from './paths';

const DEFAULT_CLASSES: ClassDef[] = [
  { class_id: 0, class_name: 'ball' },
  { class_id: 1, class_name: 'goal_left' },
  { class_id: 2, class_name: 'goal_right' },
  { class_id: 3, class_name: 'robot' },
  { class_id: 4, class_name: 'line' },
];

function toYamlDoc(classes: ClassDef[]): { names: Record<number, string> } {
  const names: Record<number, string> = {};
  for (const item of classes) {
    names[item.class_id] = item.class_name;
  }
  return { names };
}

function normalizeClasses(input: unknown): ClassDef[] {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid classes.yaml: expected object.');
  }

  const names = (input as { names?: unknown }).names;
  if (!names || typeof names !== 'object') {
    throw new Error('Invalid classes.yaml: missing names.');
  }

  const list: ClassDef[] = [];
  for (const [key, value] of Object.entries(names as Record<string, unknown>)) {
    const classId = Number.parseInt(key, 10);
    if (!Number.isFinite(classId)) {
      continue;
    }
    const className = String(value ?? '').trim();
    if (!className) {
      continue;
    }
    list.push({ class_id: classId, class_name: className });
  }

  if (list.length === 0) {
    throw new Error('Invalid classes.yaml: no valid classes found.');
  }

  return list.sort((a, b) => a.class_id - b.class_id);
}

function validateClassList(classes: ClassDef[]): void {
  const ids = new Set<number>();
  const names = new Set<string>();

  for (const cls of classes) {
    if (!Number.isInteger(cls.class_id) || cls.class_id < 0) {
      throw new Error('class_id must be a non-negative integer.');
    }
    if (!cls.class_name || !cls.class_name.trim()) {
      throw new Error('class_name must be non-empty.');
    }
    if (ids.has(cls.class_id)) {
      throw new Error(`Duplicate class_id: ${cls.class_id}`);
    }
    if (names.has(cls.class_name)) {
      throw new Error(`Duplicate class_name: ${cls.class_name}`);
    }
    ids.add(cls.class_id);
    names.add(cls.class_name);
  }
}

export async function readClasses(dataset: string): Promise<ClassDef[]> {
  await ensureDatasetDirs(dataset);
  const file = datasetClassesPath(dataset);

  try {
    const raw = await readFile(file, 'utf8');
    const parsed = YAML.parse(raw);
    return normalizeClasses(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
    await writeClasses(dataset, DEFAULT_CLASSES);
    return DEFAULT_CLASSES;
  }
}

export async function writeClasses(dataset: string, classes: ClassDef[]): Promise<void> {
  validateClassList(classes);
  await ensureDatasetDirs(dataset);
  const file = datasetClassesPath(dataset);
  const payload = YAML.stringify(toYamlDoc(classes));
  await writeFile(file, payload, 'utf8');
}

export function getDefaultClasses(): ClassDef[] {
  return DEFAULT_CLASSES;
}

export function buildClassMaps(classes: ClassDef[]): {
  byId: Map<number, string>;
  byName: Map<string, number>;
} {
  const byId = new Map<number, string>();
  const byName = new Map<string, number>();

  for (const cls of classes) {
    byId.set(cls.class_id, cls.class_name);
    byName.set(cls.class_name, cls.class_id);
  }

  return { byId, byName };
}
