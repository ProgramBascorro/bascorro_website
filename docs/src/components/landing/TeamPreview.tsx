"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Code,
  Github,
  GraduationCap,
  Linkedin,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { TEAM_MEMBERS } from "@/lib/team-data";
import { TEAM_DIVISIONS } from "./constants";

export default function TeamPreview() {
  // Show only 2025 leads or core members for preview
  const featuredMembers = TEAM_MEMBERS.filter(
    (m) => m.year === 2025 && m.isLead,
  ).slice(0, 4);

  return (
    <section id="team" className="py-24 px-8 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header with View All Button */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-8 bg-accent-yellow"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                The Squad
              </span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 uppercase tracking-tight">
              Behind <span className="text-undip-blue">The Machines</span>
            </h2>
          </div>

          <Link
            href="/team"
            className="group flex items-center gap-3 px-6 py-3 bg-gray-50 border border-gray-200 rounded-full font-bold text-gray-900 hover:bg-undip-blue hover:text-white hover:border-undip-blue transition-all duration-300"
          >
            View All Members
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>

        {/* Divisions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-20">
          {TEAM_DIVISIONS.map((div, i) => (
            <motion.div
              key={div.name}
              className="bg-gray-50 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100 hover:border-undip-blue/30 transition-colors group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl border border-gray-200 flex items-center justify-center mb-4 md:mb-6 text-gray-400 group-hover:text-undip-blue shadow-sm transition-colors">
                {div.icon === "GraduationCap" && (
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.div>
                )}
                {div.icon === "Users" && (
                  <motion.div
                    whileHover={{ scale: 1.15, y: -2 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 10,
                    }}
                  >
                    <Users className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.div>
                )}
                {div.icon === "Wrench" && (
                  <motion.div
                    whileHover={{ rotate: [0, -20, 20, -10, 10, 0] }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    <Wrench className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.div>
                )}
                {div.icon === "Zap" && (
                  <motion.div
                    whileHover={{
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1],
                    }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  >
                    <Zap className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.div>
                )}
                {div.icon === "Code" && (
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Code className="w-5 h-5 md:w-6 md:h-6" />
                  </motion.div>
                )}
              </div>
              <h4 className="font-bold text-sm md:text-xl mb-1">{div.name}</h4>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 md:mb-4 block">
                {div.role}
              </span>
              <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6 leading-relaxed line-clamp-3 md:line-clamp-none">
                {div.description}
              </p>
              <div className="border-t border-gray-200 pt-3 md:pt-4">
                <div className="text-[10px] md:text-xs font-bold text-gray-900 mb-2 md:mb-3">
                  Key Roles:
                </div>
                <div className="flex flex-wrap gap-1 md:gap-2">
                  {div.members.map((m) => (
                    <span
                      key={m}
                      className="text-[9px] md:text-[10px] font-medium bg-white border border-gray-200 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-gray-500 hover:text-undip-blue hover:border-undip-blue/20 transition-colors cursor-default"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Featured Members Preview */}
        <div>
          <h3 className="font-display font-bold text-2xl mb-8">Team Leads</h3>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {featuredMembers.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group relative"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 mb-4 md:mb-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />

                  {/* Social Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 md:gap-4 backdrop-blur-[2px]">
                    {member.socials?.linkedin && (
                      <a
                        href={member.socials.linkedin}
                        className="p-2 md:p-3 bg-white text-gray-900 rounded-full hover:bg-accent-yellow hover:text-black transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                      >
                        <Linkedin className="w-4 h-4 md:w-5 md:h-5" />
                      </a>
                    )}
                    {member.socials?.github && (
                      <a
                        href={member.socials.github}
                        className="p-2 md:p-3 bg-white text-gray-900 rounded-full hover:bg-accent-yellow hover:text-black transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-100"
                      >
                        <Github className="w-4 h-4 md:w-5 md:h-5" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm md:text-xl text-gray-900 mb-1 group-hover:text-undip-blue transition-colors truncate">
                    {member.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-accent-yellow truncate">
                      {member.division}
                    </span>
                    <span className="hidden md:inline-block w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="hidden md:inline-block text-xs text-gray-500 font-mono truncate">
                      {member.role}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/team"
              className="group flex items-center gap-3 px-6 py-3 bg-gray-50 border border-gray-200 rounded-full font-bold text-gray-900 hover:bg-undip-blue hover:text-white hover:border-undip-blue transition-all duration-300"
            >
              View All Members
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
