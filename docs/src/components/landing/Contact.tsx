"use client";

import { motion } from "framer-motion";
import { Clock, ExternalLink, Mail, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <section
      id="contact"
      className="py-24 px-8 bg-white border-t border-gray-100"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Contact Info */}
          <div className="lg:w-1/2">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px w-8 bg-accent-yellow"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Contact Us
              </span>
            </div>
            <h2 className="font-display font-bold text-4xl md:text-5xl text-gray-900 uppercase tracking-tight mb-8">
              Visit <span className="text-undip-blue">HQ</span>
            </h2>
            <p className="text-gray-500 text-lg mb-12 leading-relaxed">
              Interested in collaboration, sponsorship, or just want to see the
              robots in action? Our lab is open to visitors and partners who
              share our passion for autonomous robotics.
            </p>

            <div className="space-y-8">
              <motion.div
                className="flex gap-6 items-start group"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-undip-blue group-hover:text-white transition-colors">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Laboratory</h4>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                    Undip Robotic Development Center (URDC)
                    <br />
                    Jl. Prof. Eko Budihardjo, Tembalang,
                    <br />
                    Kec. Tembalang, Kota Semarang,
                    <br />
                    Jawa Tengah 50275
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex gap-6 items-start group"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-undip-blue group-hover:text-white transition-colors">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Email & Inquiries
                  </h4>
                  <a
                    href="mailto:urdc.undip@gmail.com"
                    className="text-gray-500 text-sm hover:text-undip-blue transition-colors"
                  >
                    bascorro.team@gmail.com
                  </a>
                  <p className="text-xs text-gray-400 mt-1">
                    Response time: 24-48 hours
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="flex gap-6 items-start group"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-undip-blue group-hover:text-white transition-colors">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Lab Hours</h4>
                  <p className="text-gray-500 text-sm">
                    Mon - Fri: 09:00 - 21:00
                    <br />
                    Sat: 10:00 - 16:00
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:w-1/2">
            <motion.div
              className="w-full h-[400px] lg:h-full bg-gray-100 rounded-3xl overflow-hidden border border-gray-200 relative shadow-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <iframe
                src="https://maps.google.com/maps?q=Undip+Robotic+Development+Center&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale hover:grayscale-0 transition-all duration-700"
                title="URDC Location"
              ></iframe>

              <div className="absolute bottom-6 right-6">
                <a
                  href="https://maps.google.com/maps?q=Undip+Robotic+Development+Center"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white px-4 py-3 rounded-xl shadow-md text-xs font-bold text-gray-900 flex items-center gap-2 hover:bg-undip-blue hover:text-white transition-colors"
                >
                  Open in Google Maps <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
