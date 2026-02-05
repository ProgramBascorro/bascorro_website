'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Calendar,
  Filter,
} from 'lucide-react';
import type { GalleryCategory, GalleryImage } from '@/lib/gallery';
import SiteFooter from '@/components/shared/SiteFooter';

type GalleryClientProps = {
  images: GalleryImage[];
  categories: { value: GalleryCategory; label: string }[];
};

const PAGE_SIZE = 24;

export default function GalleryClient({ images, categories }: GalleryClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const filteredImages = useMemo(
    () =>
      selectedCategory === 'all'
        ? images
        : images.filter((img) => img.category === selectedCategory),
    [images, selectedCategory],
  );

  const visibleImages = filteredImages.slice(0, visibleCount);

  const currentIndex = selectedImage
    ? filteredImages.findIndex((img) => img.id === selectedImage.id)
    : -1;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSelectedImage(null);
  }, [selectedCategory]);

  useEffect(() => {
    setVisibleCount((count) => Math.min(count, filteredImages.length));
  }, [filteredImages.length]);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage, currentIndex]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || visibleCount >= filteredImages.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredImages.length));
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredImages.length, visibleCount]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedImage(filteredImages[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentIndex + 1]);
    }
  };

  const handleSwipe = (deltaX: number, deltaY: number) => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX < 50 || absX < absY * 1.2) {
      return;
    }
    if (deltaX > 0) {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-undip-blue transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 hidden sm:block" />
            <h1 className="font-display font-bold text-xl sm:text-2xl text-gray-900">
              Gallery
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Camera size={16} />
            <span>{filteredImages.length} photos</span>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="sticky top-[65px] z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter size={16} className="text-gray-400 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-undip-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <AnimatePresence mode="popLayout">
            {visibleImages.map((image, index) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-200"
                onClick={() => setSelectedImage(image)}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-sm font-medium truncate">
                    {image.caption || image.alt}
                  </p>
                  {image.date && (
                    <p className="text-white/70 text-xs mt-1">{image.date}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {visibleImages.length < filteredImages.length && (
          <div ref={loadMoreRef} className="h-10" aria-hidden="true" />
        )}

        {filteredImages.length === 0 && (
          <div className="text-center py-20">
            <Camera size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No photos in this category yet.</p>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Viewing image: ${selectedImage.alt}`}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              aria-label="Close lightbox"
              className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X size={28} aria-hidden="true" />
            </button>

            {/* Navigation */}
            {currentIndex > 0 && (
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToPrevious();
                }}
                aria-label="Previous image"
                className="absolute left-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft size={36} aria-hidden="true" />
              </button>
            )}
            {currentIndex < filteredImages.length - 1 && (
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Next image"
                className="absolute right-4 z-10 p-2 text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight size={36} aria-hidden="true" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={selectedImage.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mx-4 w-[92vw] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (e.pointerType === "mouse" && e.button !== 0) {
                  return;
                }
                swipeStartRef.current = { x: e.clientX, y: e.clientY };
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerUp={(e) => {
                e.stopPropagation();
                if (!swipeStartRef.current) {
                  return;
                }
                const { x, y } = swipeStartRef.current;
                swipeStartRef.current = null;
                handleSwipe(e.clientX - x, e.clientY - y);
              }}
              onPointerCancel={() => {
                swipeStartRef.current = null;
              }}
              onTouchStart={(e) => {
                if (!e.touches[0]) {
                  return;
                }
                swipeStartRef.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
              }}
              onTouchEnd={(e) => {
                if (!swipeStartRef.current) {
                  return;
                }
                const touch = e.changedTouches[0];
                if (!touch) {
                  swipeStartRef.current = null;
                  return;
                }
                const { x, y } = swipeStartRef.current;
                swipeStartRef.current = null;
                handleSwipe(touch.clientX - x, touch.clientY - y);
              }}
            >
              <div className="relative h-[75vh] w-full">
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  fill
                  sizes="(min-width: 1024px) 80vw, 95vw"
                  className="object-contain rounded-lg"
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-white font-medium">
                  {selectedImage.caption || selectedImage.alt}
                </p>
                {selectedImage.date && (
                  <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1">
                    <Calendar size={14} />
                    {selectedImage.date}
                  </p>
                )}
                <p className="text-white/30 text-xs mt-2">
                  {currentIndex + 1} / {filteredImages.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SiteFooter className="mt-12" />
    </div>
  );
}
