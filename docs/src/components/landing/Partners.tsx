"use client";

import { motion } from "framer-motion";
import { ExternalLink, Handshake } from "lucide-react";
import Image from "next/image";

const PARTNERS = [
  {
    name: "Universitas Diponegoro",
    logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?q=80&w=2069&auto=format&fit=crop", // Placeholder for Uni logo
    type: "Institution",
    tier: "Main Patron",
  },
  {
    name: "ROBOTIS",
    logo: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop", // Placeholder (AI chip/tech vibe)
    type: "Hardware Vendor",
    tier: "Gold Sponsor",
  },
  {
    name: "NVIDIA",
    logo: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1974&auto=format&fit=crop", // Placeholder (Chip vibe)
    type: "Compute Partner",
    tier: "Silver Sponsor",
  },
  {
    name: "Maxon Motors",
    logo: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?q=80&w=2070&auto=format&fit=crop", // Placeholder (Industrial)
    type: "Actuators",
    tier: "Silver Sponsor",
  },
  {
    name: "Altium",
    logo: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", // Placeholder (Electronics)
    type: "Software License",
    tier: "Bronze Sponsor",
  },
  {
    name: "SolidWorks",
    logo: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop", // Placeholder (Design)
    type: "Design Partner",
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {PARTNERS.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 hover:bg-white/10 hover:border-undip-blue/50 transition-all duration-300"
            >
              <div className="relative w-full h-full mb-4 opacity-50 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 50vw, 16vw"
                />
              </div>
              <div className="absolute bottom-4 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
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
