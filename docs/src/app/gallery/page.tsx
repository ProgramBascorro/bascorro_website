import GalleryClient from './GalleryClient';
import { GALLERY_CATEGORIES } from '@/lib/gallery';
import { listGalleryImages } from '@/lib/r2-gallery';

export const runtime = 'nodejs';
export const revalidate = 300;

export default async function GalleryPage() {
  const images = await listGalleryImages();
  return <GalleryClient images={images} categories={GALLERY_CATEGORIES} />;
}
