import path from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import JSZip from 'jszip';
import {
  datasetClassesPath,
  datasetDir,
  datasetManifestPath,
  datasetLabelsDir,
  datasetSplitsDir,
} from './paths';

async function addFileIfExists(
  zip: JSZip,
  absPath: string,
  archivePath: string,
): Promise<void> {
  try {
    const content = await readFile(absPath);
    zip.file(archivePath, content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

async function addDirectoryRecursively(
  zip: JSZip,
  root: string,
  current: string,
): Promise<void> {
  let entries;
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    const abs = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await addDirectoryRecursively(zip, root, abs);
      continue;
    }

    const relative = path.relative(root, abs).split(path.sep).join('/');
    const content = await readFile(abs);
    zip.file(relative, content);
  }
}

export async function createDatasetExportZip(dataset: string): Promise<Buffer> {
  const zip = new JSZip();
  const base = datasetDir(dataset);

  await addFileIfExists(zip, datasetManifestPath(dataset), 'manifest.json');
  await addFileIfExists(zip, datasetClassesPath(dataset), 'classes.yaml');

  await addDirectoryRecursively(zip, base, datasetLabelsDir(dataset));
  await addDirectoryRecursively(zip, base, datasetSplitsDir(dataset));

  return zip.generateAsync({ type: 'nodebuffer' });
}
