"use client";

import { motion } from "framer-motion";
import { ExternalLink, Handshake } from "lucide-react";
import Image from "next/image";

const PARTNERS = [
  {
    name: "PAKUWON JATI",
    logo: "/pakuwon_jati.jpeg",
    type: "Property",
  },
];

export default function Partners() {
  const visiblePartners = PARTNERS;

  return (
    <section className="py-24 px-8 bg-[#111111] border-t border-white/10 relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-undip-blue/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-8 bg-accent-yellow"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Our Supporters
              </span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-white uppercase tracking-tight">
              Powered <span className="text-gray-500">By</span>
            </h2>
          </div>

          <a
            href="#contact"
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            Become a Sponsor <ExternalLink size={16} />
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {visiblePartners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                y: -8, 
                transition: { duration: 0.2 }
              }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="group"
            >
              <div className="aspect-square bg-white rounded-[2.5rem] p-8 shadow-xl flex items-center justify-center border-b-4 border-gray-200 group-hover:border-undip-blue transition-all relative overflow-hidden">
                <div className="relative w-full h-full">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors uppercase tracking-[0.2em] px-2 line-clamp-2 leading-relaxed">
                  {partner.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-20 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-undip-blue/20 to-transparent border border-undip-blue/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-undip-blue flex items-center justify-center text-white shrink-0 shadow-lg shadow-undip-blue/20">
              <Handshake size={32} />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-white mb-2">
                Partner with EWS BASCORRO
              </h3>
              <p className="text-gray-400 max-w-md text-sm leading-relaxed">
                Join us in advancing humanoid robotics research. Gain visibility
                and access to top engineering talent at Universitas Diponegoro.
              </p>
            </div>
          </div>
          <a href="#contact">

          <button
            type="button"
            className="px-8 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-accent-yellow transition-colors whitespace-nowrap shadow-xl"
            >
            Get Sponsorship Deck
          </button>
            </a>
        </div>
      </div>
    </section>
  );
}
