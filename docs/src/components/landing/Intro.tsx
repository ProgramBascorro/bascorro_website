'use client';

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface IntroProps {
  onComplete: () => void;
}

const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Allow exit animation to finish
    }, 2500); // Duration of the "yellow" state
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* The grid columns mimicking the video intro */}
          <div className="absolute inset-0 flex w-full h-full">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-full flex-1 bg-accent-yellow border-r border-yellow-600/20"
                initial={{ scaleY: 1 }}
                exit={{
                  scaleY: 0,
                  transition: {
                    duration: 0.8,
                    delay: i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                style={{ originY: 0 }} // Shrink to top
              />
            ))}
          </div>

          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl">
               <Image 
                 src="/favicon1.png" 
                 alt="EWS Bascorro Logo" 
                 fill 
                 className="object-contain"
               />
            </div>
            <h1 className="text-undip-blue font-display font-black text-5xl md:text-7xl tracking-tighter text-center">
              EWS BASCORRO
            </h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Intro;
