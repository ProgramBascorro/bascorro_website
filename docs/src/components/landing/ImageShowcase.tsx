"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const SHOWCASE_IMAGES = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1517055729445-db718dc5b89d?q=80&w=2070&auto=format&fit=crop",
    title: "RoboCup 2024",
    location: "Eindhoven, Netherlands",
    category: "Competition",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop",
    title: "Lab Testing",
    location: "Semarang, Indonesia",
    category: "Development",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=2006&auto=format&fit=crop",
    title: "Team Collaboration",
    location: "Engineering Center",
    category: "Team",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=2032&auto=format&fit=crop",
    title: "Autonomous Vision",
    location: "Field Test",
    category: "Technology",
  },
];

const TEAM_MOMENTS = [
  {
    id: "t1",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop",
    caption: "Late night debugging session",
    tag: "Software",
  },
  {
    id: "t2",
    url: "https://images.unsplash.com/photo-1581092921461-eab62e97a782?q=80&w=2070&auto=format&fit=crop",
    caption: "Mechanical assembly",
    tag: "Hardware",
  },
  {
    id: "t3",
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    caption: "Strategy meeting",
    tag: "Management",
  },
  {
    id: "t4",
    url: "https://images.unsplash.com/photo-1504384308090-c54be3855463?q=80&w=2070&auto=format&fit=crop",
    caption: "Celebration",
    tag: "Life",
  },
];

export default function ImageShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex(
      (prev) =>
        (prev + newDirection + SHOWCASE_IMAGES.length) % SHOWCASE_IMAGES.length,
    );
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [paginate]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <section className="bg-[#111111] text-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 md:flex justify-between items-end">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-8 bg-accent-yellow"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Visual Archive
              </span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white uppercase tracking-tight">
              Moments of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-undip-blue to-cyan-400">
                Impact
              </span>
            </h2>
          </div>
          <div className="hidden md:flex gap-4 mt-6 md:mt-0">
            <button
              type="button"
              onClick={() => paginate(-1)}
              className="p-4 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              className="p-4 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Main Carousel */}
        <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden bg-gray-900 border border-white/10 mb-20 group">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0"
            >
              <Image
                src={SHOWCASE_IMAGES[currentIndex].url}
                alt={SHOWCASE_IMAGES[currentIndex].title}
                fill
                className="object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 80vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-block px-3 py-1 mb-4 bg-accent-yellow/10 text-accent-yellow text-xs font-bold uppercase tracking-widest rounded-full border border-accent-yellow/20">
                    {SHOWCASE_IMAGES[currentIndex].category}
                  </span>
                  <h3 className="font-display font-black text-4xl md:text-6xl mb-2">
                    {SHOWCASE_IMAGES[currentIndex].title}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-400 font-mono text-sm">
                    <Camera size={16} />
                    {SHOWCASE_IMAGES[currentIndex].location}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress Indicators */}
          <div className="absolute bottom-8 right-8 flex gap-2 z-10">
            {SHOWCASE_IMAGES.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-8 bg-accent-yellow"
                    : "w-2 bg-white/30"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <div className="lg:col-span-2 bg-undip-blue rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
            <div className="absolute top-0 right-0 p-12 opacity-10">
              <Trophy size={200} />
            </div>
            <div className="relative z-10">
              <h3 className="font-display font-bold text-3xl md:text-4xl mb-6">
                Our Journey
              </h3>
              <p className="text-white/80 leading-relaxed mb-8 max-w-md">
                From late nights in the lab to the international stage, every
                moment defines our pursuit of excellence in autonomous robotics.
              </p>
              <a
                href="/gallery"
                className="inline-flex items-center gap-2 font-bold hover:gap-4 transition-all"
              >
                View Full Gallery <ChevronRight size={20} />
              </a>
            </div>
          </div>

          {TEAM_MOMENTS.map((moment) => (
            <motion.div
              key={moment.id}
              className="group relative h-[300px] rounded-3xl overflow-hidden bg-gray-900 border border-white/10"
              whileHover={{ y: -5 }}
            >
              <Image
                src={moment.url}
                alt={moment.caption}
                fill
                className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <span className="text-xs font-bold text-accent-yellow uppercase tracking-wider mb-2 block">
                  {moment.tag}
                </span>
                <p className="font-bold text-white">{moment.caption}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
