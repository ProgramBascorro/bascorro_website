"use client";

import { motion } from "framer-motion";
import { ExternalLink, Handshake } from "lucide-react";
import Image from "next/image";

const PARTNERS = [
  {
    name: "PT PLN (Persero)",
    logo: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2070&auto=format&fit=crop", // Electricity/Grid
    type: "Energy Utility",
    tier: "Main Patron",
  },
  {
    name: "PT Pertamina (Persero)",
    logo: "https://images.unsplash.com/photo-1563291074-2bf867700e8e?q=80&w=2070&auto=format&fit=crop", // Oil/Gas/Industrial
    type: "Energy & Oil",
    tier: "Platinum Sponsor",
  },
  {
    name: "Katup Industri Indonesia",
    logo: "https://images.unsplash.com/photo-1535970793482-07de93762dc4?q=80&w=2070&auto=format&fit=crop", // Industrial Valves/Pipes
    type: "Valve Manufacturing",
    tier: "Gold Sponsor",
  },
  {
    name: "Enviromate Tech Int (ETI)",
    logo: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=1974&auto=format&fit=crop", // Green/Tech
    type: "Green Energy Infrastructure",
    tier: "Gold Sponsor",
  },
  {
    name: "Bumi Agung Perkasa",
    logo: "https://images.unsplash.com/photo-1533062657738-bfbc783b2729?q=80&w=2070&auto=format&fit=crop", // Metal/Galvanizing
    type: "Industrial Coating",
    tier: "Silver Sponsor",
  },
  {
    name: "Recare",
    logo: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2069&auto=format&fit=crop", // Professional/Handshake
    type: "Professional Services",
    tier: "Silver Sponsor",
  },
  {
    name: "Pakuwon Jati",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop", // City/Building
    type: "Property Developer",
    tier: "Bronze Sponsor",
  },
];

export default function Partners() {
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {PARTNERS.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 hover:bg-white/10 hover:border-undip-blue/50 transition-all duration-300"
            >
              <div className="relative w-full h-full mb-4 opacity-50 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0 overflow-hidden rounded-xl">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <div className="absolute bottom-4 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 bg-black/60 backdrop-blur-sm py-2">
                <p className="text-xs font-bold text-white mb-0.5">
                  {partner.name}
                </p>
                <p className="text-[10px] text-accent-yellow uppercase tracking-wider font-mono">
                  {partner.tier}
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
          <button
            type="button"
            className="px-8 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-accent-yellow transition-colors whitespace-nowrap shadow-xl"
          >
            Get Sponsorship Deck
          </button>
        </div>
      </div>
    </section>
  );
}
