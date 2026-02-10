"use client";

import { motion } from "framer-motion";
import { useSearchContext } from "fumadocs-ui/contexts/search";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Brain,
  ChevronDown,
  Code,
  Eye,
  Images,
  Monitor,
  Search,
  Trophy,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import {
  COMPETITIONS,
  FAQ_ITEMS,
  ROBOTS,
  TEAM_DIVISIONS,
  TECH_STACK,
} from "./constants";
import ImageShowcase from "./ImageShowcase";
import Achievements from "./Achievements";
import TeamPreview from "./TeamPreview";
import Partners from "./Partners";
import Publications from "./Publications";
import Contact from "./Contact";
import ModelViewer from "./ModelViewer";
import Navbar from "./Navbar";
import SiteFooter from "../shared/SiteFooter";

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <div className="mb-12 md:mb-20">
    <div className="flex items-center gap-4 mb-4">
      <div className="h-px w-8 bg-accent-yellow"></div>
      <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
        {subtitle || "Section"}
      </span>
    </div>
    <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 uppercase tracking-tight">
      {title}
    </h2>
  </div>
);

const Hero: React.FC = () => {
  const { setOpenSearch } = useSearchContext();
  const [show3D, setShow3D] = useState(false);

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-[#1a1a1a] ">
      {/* Main Card Container - Scrollable */}
      <motion.div
        className="flex-1 bg-[#f3f4f6] shadow-2xl relative flex flex-col w-full h-full overflow-y-auto overscroll-y-contain scroll-smooth custom-scrollbar"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Navbar />

        {/* --- SECTION 1: HERO --- */}
        <header className="relative flex flex-col ">
          {/* Grid Background */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
            <div className="w-full h-full grid grid-cols-6 md:grid-cols-12 gap-0">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="border-r border-gray-900 h-full"></div>
              ))}
            </div>
            <div className="absolute inset-0 grid grid-rows-6 gap-0">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border-b border-gray-900 w-full"></div>
              ))}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row relative z-10 lg:flex-1">
            {/* Left Text */}
            <div className="w-full lg:w-[55%] p-6 sm:p-12 lg:p-16 flex flex-col justify-center order-2 lg:order-1 bg-[#f3f4f6]">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="inline-block px-3 py-1 mb-6 border border-gray-300 rounded-full text-xs font-mono text-gray-500 bg-white/50 backdrop-blur-sm">
                  EST. 2017 // UNDIP ROBOTICS
                </div>
                <h1 className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7rem] leading-[0.85] tracking-tighter text-gray-900 mb-4 sm:mb-6">
                  EWS BASCORRO
                </h1>
                <p className="font-serif text-lg sm:text-xl md:text-2xl text-gray-600 italic max-w-lg leading-relaxed mb-6 sm:mb-8 border-l-4 border-accent-yellow pl-4 sm:pl-6">
                  "Vincit Omnia Paratus" — Ready to Conquer All.
                </p>
                <p className="text-gray-500 mb-8 max-w-md">
                  The RoboSoccer Team of Universitas Diponegoro, aligned with
                  UNDIP's 4th Research Pillar: Research and Technology.
                </p>

                {/* Search Input */}
                <button
                  onClick={() => setOpenSearch(true)}
                  className="w-full max-w-md flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 mb-6 sm:mb-8 bg-white border border-gray-200 rounded-xl text-left hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <Search className="w-5 h-5 text-gray-400 group-hover:text-undip-blue transition-colors" />
                  <span className="flex-1 text-gray-400 text-sm">
                    Search documentation...
                  </span>
                  <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-mono bg-gray-100 rounded border border-gray-200 text-gray-400">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                  <a
                    href="#robots"
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-undip-blue text-white font-bold rounded-full hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                  >
                    Meet the Robots <ArrowRight size={18} />
                  </a>
                  <a
                    href="#join"
                    className="px-6 sm:px-8 py-3 sm:py-4 border border-gray-300 text-gray-900 font-bold rounded-full hover:bg-white transition-colors text-center"
                  >
                    Join the Team
                  </a>
                  <a
                    href="/docs/learning"
                    className="px-6 sm:px-8 py-3 sm:py-4 border border-gray-300 text-gray-900 font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen size={18} />
                    Learning Hub
                  </a>
                  <a
                    href="/gallery"
                    className="px-6 sm:px-8 py-3 sm:py-4 border border-gray-300 text-gray-900 font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Images size={18} />
                    Gallery
                  </a>
                  <a
                    href="/competitions"
                    className="px-6 sm:px-8 py-3 sm:py-4 border border-gray-300 text-gray-900 font-bold rounded-full hover:bg-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Trophy size={18} />
                    Competitions
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right Image */}
            <div className="w-full lg:w-[45%] relative h-[40vh] sm:h-[50vh] lg:h-auto border-b lg:border-b-0 lg:border-l border-gray-300 overflow-hidden bg-gray-200 order-1 lg:order-2">
              <img
                src="https://imgbascorro.myudak.com/WhatsApp%20Image%202024-09-06%20at%2021.16.15_3ab5d883.jpg"
                alt="Robotics Lab"
                className="w-full h-full object-cover grayscale mix-blend-multiply opacity-80 hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#f3f4f6] via-transparent to-transparent lg:hidden"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#f3f4f6]/50 hidden lg:block"></div>

              <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8">
                <div className="flex justify-between items-end">
                  <div className="text-xs font-mono">
                    <div className="mb-1">SYS.STATUS: ONLINE</div>
                    <div>LOC: SEMARANG, ID</div>
                  </div>
                  <Activity className="text-accent-yellow animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 w-full hidden lg:flex justify-center pb-8 animate-bounce z-20">
            <a
              href="#about"
              className="text-gray-400 hover:text-black transition-colors"
            >
              <ChevronDown size={32} />
            </a>
          </div>
        </header>

        {/* --- SECTION 2: ABOUT --- */}
        <section
          id="about"
          className="px-8 py-24 md:px-16 border-t border-gray-300 bg-white"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16">
              <div className="md:w-1/3">
                <h3 className="font-display font-bold text-4xl mb-6">
                  Who We Are
                </h3>
                <p className="text-gray-500 leading-relaxed mb-6">
                  EWS BASCORRO aims to compete in the Regional and National
                  Indonesian Robot Contest (KRI) and participate in RoboCup
                  (Asia-Pacific & World). We operate under UNDIP ROBOTIC
                  DEVELOPMENT CENTRE.
                </p>
                <div className="grid grid-cols-3 gap-8 mt-12">
                  <div>
                    <div className="text-4xl font-black text-undip-blue mb-2">
                      20+
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Active Members
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-undip-blue mb-2">
                      2
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Robots Built
                    </div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-undip-blue mb-2">
                      2
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Robots on Development
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-xl mb-4 text-undip-blue">
                    Our Vision
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    To become the leading pioneer in human-android technology
                    within the Indonesian university ecosystem. "Vincit Omnia
                    Paratus" — Ready to Conquer All.
                  </p>
                </div>
                <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-xl mb-4 text-undip-blue">
                    Our Mission
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    To excel in KRI and RoboCup while mastering electric,
                    mechanical, and software integration. "Dalam satu asa, kami
                    tergerak. Lawan. Sikat. Juara!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2.5: FEATURED VIDEO --- */}
        <section className="px-8 py-20 md:px-16 border-t border-gray-200 bg-[#f3f4f6]">
          <div className="max-w-6xl mx-auto">
            <SectionHeader
              title="EWS Bascorro Qualification RoboCup Humanoid Soccer League Kid Size 2026"
              subtitle="Featured Video"
            />
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="aspect-video w-full">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/C7drE_bRktE"
                  title="EWS Bascorro Qualification RoboCup Humanoid Soccer League Kid Size 2026"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>

       {/* --- SECTION 5.5: IMAGE SHOWCASE --- */}
        {/* <ImageShowcase /> */}

        {/* --- SECTION 3: ROBOTS --- */}
        <section
          id="robots"
          className="px-4 py-16 md:px-16 bg-[#f3f4f6] relative"
        >
          {/* Decorative Grid */}
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <div className="w-64 h-64 border border-black rounded-full border-dashed animate-spin-slow"></div>
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <SectionHeader title="Our Machines" subtitle="Engineering" />

            {/* Mobile 3D Model Toggle */}
            <div className="md:hidden mb-6">
              <button
                type="button"
                onClick={() => setShow3D(!show3D)}
                className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {show3D ? (
                  <>
                    Hide 3D Model <ChevronDown className="rotate-180" size={16} />
                  </>
                ) : (
                  <>
                    View 3D Robot Model <ChevronDown size={16} />
                  </>
                )}
              </button>
            </div>

            {/* 3D Model Showcase */}
            <div className={`mb-16 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden ${show3D ? "block" : "hidden"} md:block`}>
              <div className="flex flex-col lg:flex-row">
                {/* 3D Viewer */}
                <div className="w-full lg:w-2/3 h-[400px] md:h-[500px] bg-gradient-to-br from-gray-50 to-gray-100">
                  <ModelViewer className="w-full h-full" />
                </div>

                {/* Info Panel */}
                <div className="w-full lg:w-1/3 p-8 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-200">
                  <div className="inline-block px-3 py-1 mb-4 bg-undip-blue/10 text-undip-blue text-xs font-bold uppercase tracking-widest rounded-full w-fit">
                    Interactive 3D Model
                  </div>
                  <h3 className="font-display font-bold text-2xl md:text-3xl mb-4 text-gray-900">
                    ROBOTIS OP3
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    Explore our humanoid robot in full 3D. Drag to rotate,
                    scroll to zoom, and use two fingers to pan around the model.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-600">
                      Rotate: Drag
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-600">
                      Zoom: Scroll
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-mono text-gray-600">
                      Pan: Shift+Drag
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-8">
              {ROBOTS.map((robot, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-200"
                >
                  <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden group-hover:bg-gray-50 transition-colors">
                    <Image
                      src={robot.image}
                      alt={robot.name}
                      fill
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-3 right-3 md:top-6 md:right-6 bg-undip-blue/90 backdrop-blur-md px-2 py-0.5 md:px-3 md:py-1 rounded text-[8px] md:text-[10px] font-bold font-mono text-white border border-white/20 z-10 shadow-lg">
                      {robot.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="p-4 md:p-8">
                    <h3 className="text-lg md:text-2xl font-bold font-display mb-1 md:mb-2">
                      {robot.name}
                    </h3>
                    <p className="text-gray-600 mb-4 md:mb-6 text-xs md:text-sm line-clamp-3 md:line-clamp-none">{robot.desc}</p>

                    <div className="space-y-2 md:space-y-3">
                      <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 md:mb-2">
                        Specifications
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2">
                        {robot.specs.map((spec, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 px-2 py-1 md:px-3 md:py-2 rounded border border-gray-100 text-[9px] md:text-xs font-mono text-gray-700 truncate"
                          >
                            {spec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 4: TECH STACK --- */}
        <section
          id="tech"
          className="px-4 py-16 md:px-16 bg-[#1a1a1a] text-white"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="font-display font-bold text-4xl md:text-5xl uppercase tracking-tight mb-4 text-white">
                Core Intelligence
              </h2>
              <p className="text-gray-400 max-w-2xl">
                Our robots don't just move; they think. Powered by ROS 2 and
                advanced computer vision.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
              {TECH_STACK.map((tech, i) => (
                <div
                  key={i}
                  className="border border-white/10 p-4 md:p-6 rounded-2xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-undip-blue/20 rounded-xl flex items-center justify-center text-accent-yellow mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                    {tech.icon === "Eye" && <Eye className="w-5 h-5 md:w-6 md:h-6" />}
                    {tech.icon === "Activity" && <Activity className="w-5 h-5 md:w-6 md:h-6" />}
                    {tech.icon === "Brain" && <Brain className="w-5 h-5 md:w-6 md:h-6" />}
                    {tech.icon === "Monitor" && <Monitor className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <h4 className="font-bold text-sm md:text-lg mb-1 md:mb-2">{tech.title}</h4>
                  <p className="text-xs md:text-sm text-gray-400 leading-relaxed line-clamp-3 md:line-clamp-none">
                    {tech.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 5: ACHIEVEMENTS & COMPETITIONS --- */}
        <Achievements />

 

        {/* --- SECTION 6: TEAM (MERGED) --- */}
        <TeamPreview />

        {/* --- SECTION 6.5: PARTNERS --- */}
        <Partners />

        {/* --- SECTION 6.75: PUBLICATIONS --- */}
        <Publications />

        {/* --- SECTION 7: JOIN --- */}
        <section id="join" className="px-8 py-24 md:px-16 bg-white relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display font-black text-5xl md:text-7xl text-gray-900 mb-8 tracking-tighter">
              BUILD THE FUTURE
            </h2>
            <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
              We are recruiting students from Universitas Diponegoro for the
              2025 season. No prior robotics experience required—just a hunger
              to learn.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-4 mb-16">
              <button className="px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-all transform hover:-translate-y-1">
                Apply Now (Google Form)
              </button>
              <button className="px-8 py-4 border border-gray-300 font-bold rounded-full hover:bg-gray-50 transition-colors">
                View Open Roles
              </button>
            </div>

            {/* FAQ Preview */}
            <div className="border-t border-gray-200 pt-12 text-center">
              <h3 className="font-bold text-xl mb-6">
                Frequently Asked Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} className="text-center">
                    <h4 className="font-bold text-sm mb-2">{item.q}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 7.5: CONTACT --- */}
        <Contact />

        {/* --- SECTION 8: FOOTER --- */}
        <SiteFooter />
      </motion.div>
    </div>
  );
};

export default Hero;
