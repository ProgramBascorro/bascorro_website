'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Linkedin, Search, Filter } from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import { TEAM_MEMBERS, TEAM_YEARS } from "@/lib/team-data";

export default function TeamPage() {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = TEAM_MEMBERS.filter((member) => {
    const matchesYear = member.year === selectedYear;
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.division.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <header className="bg-[#1a1a1a] text-white pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-3 py-1 mb-6 border border-white/20 rounded-full text-xs font-mono text-gray-400 bg-white/5 backdrop-blur-sm">
              TEAM DIRECTORY // {selectedYear}
            </div>
            <h1 className="font-display font-black text-5xl md:text-7xl mb-6">
              MEET THE <span className="text-undip-blue">TEAM</span>
            </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
                          The engineers, designers, and strategists behind EWS BASCORRO's
                          success on and off the field.
                        </p>
          </motion.div>
        </div>
      </header>

      {/* Controls */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Year Filter */}
          <div className="flex bg-gray-100 p-1 rounded-full overflow-x-auto max-w-full no-scrollbar">
            {TEAM_YEARS.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  selectedYear === year 
                    ? "bg-white text-gray-900 shadow-sm" 
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {year} Season
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-auto min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search member, role, or division..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent focus:bg-white border focus:border-gray-300 rounded-xl text-sm transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        {filteredMembers.length === 0 ? (
           <div className="text-center py-20">
             <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
               <Filter size={24} />
             </div>
             <h3 className="font-bold text-gray-900 text-lg mb-2">No members found</h3>
             <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((member) => (
                <motion.div
                  layout
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-undip-blue/20 transition-all duration-300"
                >
                  <div className="relative aspect-square bg-gray-200 overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                        member.isLead 
                          ? "bg-accent-yellow text-black border-accent-yellow" 
                          : "bg-white/90 text-gray-600 border-white/20"
                      }`}>
                        {member.division}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-display font-bold text-xl text-gray-900 mb-1 group-hover:text-undip-blue transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-sm font-mono text-gray-500 mb-4">{member.role}</p>
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      {member.socials?.linkedin && (
                        <a 
                          href={member.socials.linkedin} 
                          className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-[#0077b5] hover:text-white transition-colors"
                        >
                          <Linkedin size={16} />
                        </a>
                      )}
                      {member.socials?.github && (
                        <a 
                          href={member.socials.github} 
                          className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-black hover:text-white transition-colors"
                        >
                          <Github size={16} />
                        </a>
                      )}
                      {!member.socials && (
                        <span className="text-[10px] text-gray-300 font-mono py-1">NO SOCIALS LINKED</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
