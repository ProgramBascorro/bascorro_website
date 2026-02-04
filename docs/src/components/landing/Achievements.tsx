"use client";

import { motion } from "framer-motion";
import { ArrowRight, Award, Trophy } from "lucide-react";
import { COMPETITIONS, TEAM_ACHIEVEMENTS } from "./constants";

export default function Achievements() {
  return (
    <section className="px-8 py-24 md:px-16 bg-accent-yellow text-undip-blue">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-8 bg-undip-blue"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-undip-blue/70">
              Track Record
            </span>
          </div>
          <h2 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tight">
            Competitions
          </h2>
        </div>

        {/* Competitions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 md:gap-12 mb-20">
          {COMPETITIONS.map((comp, i) => (
            <motion.div
              key={comp.name}
              className="border-t-2 border-undip-blue/20 pt-4 md:pt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex justify-between items-start mb-2 md:mb-4">
                <h3 className="font-bold text-lg md:text-2xl text-undip-blue leading-tight">
                  {comp.name}
                </h3>
                <span className="bg-undip-blue/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold text-undip-blue shrink-0 ml-2">
                  {comp.year}
                </span>
              </div>
              <div className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-undip-blue/60 mb-2">
                {comp.role}
              </div>
              <p className="text-sm md:text-base text-undip-blue/80 leading-relaxed mb-4">{comp.desc}</p>
              {comp.name.includes("RoboCup") && (
                <a
                  href="/robocup"
                  className="inline-flex items-center gap-1 text-xs md:text-sm font-bold text-undip-blue hover:underline"
                >
                  Learn More <ArrowRight size={14} />
                </a>
              )}
            </motion.div>
          ))}
        </div>

        {/* Achievements List */}
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-undip-blue/10">
          <h3 className="font-display font-bold text-2xl md:text-3xl mb-8 flex items-center gap-3">
            <Trophy className="text-undip-blue" />
            Recent Achievements
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-6">
            {TEAM_ACHIEVEMENTS.map((item, idx) => (
              <motion.div
                key={item.year + item.competition}
                className="flex flex-col md:flex-row items-center md:justify-between gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-white/60 border border-undip-blue/5 hover:border-undip-blue/20 transition-colors h-full"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                viewport={{ once: true }}
              >
                <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full md:w-auto">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-accent-yellow rounded-lg flex items-center justify-center text-undip-blue font-bold font-display text-lg md:text-xl shrink-0 shadow-sm">
                    {item.year.slice(-2)}
                  </div>
                  <div className="text-center md:text-left">
                    <h4 className="font-bold text-xs md:text-lg text-undip-blue leading-tight mb-1">
                      {item.competition}
                    </h4>
                    <div className="flex flex-wrap justify-center md:justify-start gap-1.5 md:gap-2 text-[9px] md:text-xs font-mono text-undip-blue/60">
                      <span className="bg-white/50 px-1.5 py-0.5 rounded border border-undip-blue/10">{item.category}</span>
                      <span className="bg-white/50 px-1.5 py-0.5 rounded border border-undip-blue/10">{item.level}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 bg-undip-blue/5 px-3 py-1.5 rounded-full md:bg-transparent md:p-0">
                  <Award className="hidden md:block text-undip-blue md:w-[18px] md:h-[18px]" />
                  <span className="font-bold text-[10px] md:text-base text-undip-blue text-center leading-tight">
                    {item.result}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
