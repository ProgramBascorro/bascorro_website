import 'server-only';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { GALLERY_METADATA, type GalleryImage } from '@/lib/gallery';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const env = {
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  endpoint: process.env.R2_ENDPOINT,
  bucket: process.env.R2_BUCKET,
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  prefix: process.env.R2_GALLERY_PREFIX ?? 'images/gallery/',
};

const ensureEnv = () => {
  const missing = Object.entries({
    R2_ACCESS_KEY_ID: env.accessKeyId,
    R2_SECRET_ACCESS_KEY: env.secretAccessKey,
    R2_ENDPOINT: env.endpoint,
    R2_BUCKET: env.bucket,
    R2_PUBLIC_BASE_URL: env.publicBaseUrl,
  }).filter(([, value]) => !value);

  if (missing.length > 0) {
    const keys = missing.map(([key]) => key).join(', ');
    throw new Error(`Missing required R2 env vars: ${keys}`);
  }
};

const client = () => {
  ensureEnv();
  return new S3Client({
    region: 'auto',
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.accessKeyId as string,
      secretAccessKey: env.secretAccessKey as string,
    },
  });
};

const humanizeFilename = (key: string) => {
  const file = key.split('/').pop() ?? key;
  const base = file.replace(/\.[^/.]+$/, '');
  const withSpaces = base.replace(/[-_]+/g, ' ').trim();
  return withSpaces.length > 0
    ? withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1)
    : 'Gallery photo';
};

const extensionFromKey = (key: string) => {
  const dot = key.lastIndexOf('.');
  return dot >= 0 ? key.slice(dot).toLowerCase() : '';
};

const resolveMetadata = (key: string) => {
  if (GALLERY_METADATA[key]) {
    return GALLERY_METADATA[key];
  }
  const file = key.split('/').pop() ?? key;
  return GALLERY_METADATA[file];
};

export async function listGalleryImages(): Promise<GalleryImage[]> {
  let s3: S3Client;
  try {
    s3 = client();
  } catch (error) {
    console.warn(
      `[Gallery] ${error instanceof Error ? error.message : "Missing R2 env vars"}. Returning empty gallery.`
    );
    return [];
  }

  const images: Array<GalleryImage & { sortTime: number }> = [];
  const baseUrl = (env.publicBaseUrl as string).replace(/\/$/, '');
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: env.bucket,
        Prefix: env.prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      const key = object.Key;
      if (!key || key.endsWith('/')) {
        continue;
      }
      if (!IMAGE_EXTENSIONS.has(extensionFromKey(key))) {
        continue;
      }

      const metadata = resolveMetadata(key);
      const alt = metadata?.alt ?? metadata?.caption ?? humanizeFilename(key);
      const src = `${baseUrl}/${key}`;
      const parsedDate = metadata?.date ? Date.parse(metadata.date) : Number.NaN;
      const sortTime = Number.isFinite(parsedDate)
        ? parsedDate
        : object.LastModified?.getTime() ?? 0;

      images.push({
        id: key,
        src,
        alt,
        category: metadata?.category,
        caption: metadata?.caption,
        date: metadata?.date,
        sortTime,
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  images.sort((a, b) => b.sortTime - a.sortTime);
  return images.map(({ sortTime, ...image }) => image);
}
