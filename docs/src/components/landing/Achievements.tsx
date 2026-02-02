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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          {COMPETITIONS.map((comp, i) => (
            <motion.div
              key={comp.name}
              className="border-t-2 border-undip-blue/20 pt-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-2xl text-undip-blue">
                  {comp.name}
                </h3>
                <span className="bg-undip-blue/10 px-3 py-1 rounded-full text-xs font-bold text-undip-blue">
                  {comp.year}
                </span>
              </div>
              <div className="text-sm font-bold uppercase tracking-wider text-undip-blue/60 mb-2">
                {comp.role}
              </div>
              <p className="text-undip-blue/80 leading-relaxed">{comp.desc}</p>
              {comp.name.includes("RoboCup") && (
                <a
                  href="/robocup"
                  className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-undip-blue hover:underline"
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

          <div className="grid grid-cols-1 gap-6">
            {TEAM_ACHIEVEMENTS.map((item, idx) => (
              <motion.div
                key={item.year + item.competition}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white/60 border border-undip-blue/5 hover:border-undip-blue/20 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-yellow rounded-lg flex items-center justify-center text-undip-blue font-bold font-display text-xl shrink-0">
                    {item.year.slice(-2)}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-undip-blue">
                      {item.competition}
                    </h4>
                    <div className="flex gap-2 text-xs font-mono text-undip-blue/60 mt-1">
                      <span>{item.category}</span>
                      <span>•</span>
                      <span>{item.level}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-16 md:pl-0">
                  <Award size={18} className="text-undip-blue" />
                  <span className="font-bold text-undip-blue">
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
