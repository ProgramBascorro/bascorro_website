"use client";

import { motion } from "framer-motion";
import { Download, ExternalLink, FileText } from "lucide-react";

const PUBLICATIONS = [
  {
    title:
      "Team Description Paper - EWS BASCORRO Humanoid Robosoccer Team",
    authors: "EWS BASCORRO Research Division",
    conference: "RoboCup Humanoid League 2026",
    year: "2026",
    link: "/TDP%20EWS%20Bascorro.pdf",
    type: "Team Description Paper",
  },
];

export default function Publications() {
  return (
    <section
      id="publications"
      className="py-24 px-8 bg-gray-50 border-t border-gray-200"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-8 bg-accent-yellow"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Research & Development
              </span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 uppercase tracking-tight">
              Selected <span className="text-undip-blue">Publications</span>
            </h2>
          </div>

          <a
            href="https://scholar.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-undip-blue transition-colors"
          >
            View Google Scholar <ExternalLink size={16} />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PUBLICATIONS.map((pub, i) => (
            <motion.div
              key={pub.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-undip-blue/30 hover:shadow-lg transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider rounded-full group-hover:bg-undip-blue group-hover:text-white transition-colors">
                  {pub.type}
                </span>
                <span className="text-sm font-mono text-gray-400 font-bold">
                  {pub.year}
                </span>
              </div>

              <h3 className="font-bold text-xl text-gray-900 mb-3 leading-snug group-hover:text-undip-blue transition-colors">
                {pub.title}
              </h3>

              <p className="text-sm text-gray-500 mb-2 font-medium">
                {pub.authors}
              </p>

              <p className="text-xs text-gray-400 font-mono mb-6 border-l-2 border-gray-200 pl-3">
                {pub.conference}
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <a
                  href={pub.link}
                  className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-undip-blue transition-colors"
                >
                  <FileText size={14} /> Read Paper
                </a>
                <a
                  href={pub.link}
                  className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-undip-blue transition-colors"
                >
                  <Download size={14} /> PDF
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
