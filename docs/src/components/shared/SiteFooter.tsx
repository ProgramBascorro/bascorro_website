"use client";

import { Instagram, Linkedin, Youtube } from "lucide-react";

type SiteFooterProps = {
  className?: string;
};

export default function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer
      className={`bg-[#1a1a1a] text-white pt-24 pb-12 px-8 md:px-16 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div>
          <h2 className="font-display font-black text-3xl mb-4">
            EWS BASCORRO
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mb-6">
            Humanoid Robosoccer Team
            <br />
            Universitas Diponegoro
            <br />
            Semarang, Indonesia
          </p>
          <div className="flex gap-4 text-gray-400">
            <a
              href="https://www.instagram.com/ewsbascorroundip/"
              className="hover:text-white transition-colors"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://www.tiktok.com/search?q=ewsbascorro&t=1770203046348"
              className="hover:text-white transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-label="TikTok"
              >
                <path d="M17.4 5.1c-1-.9-1.6-2.1-1.7-3.4h-3.6v13.2c0 1.2-1 2.2-2.2 2.2-1.2 0-2.2-1-2.2-2.2 0-1.2 1-2.2 2.2-2.2.3 0 .6 0 .9.1V8.6c-.3 0-.6-.1-.9-.1-3.2 0-5.8 2.6-5.8 5.8 0 3.2 2.6 5.8 5.8 5.8 3.2 0 5.8-2.6 5.8-5.8V9.2c1.3 1 3 1.6 4.8 1.6V7.3c-1.1 0-2.2-.4-3-1.2z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/ewsbascorro/"
              className="hover:text-white transition-colors"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="https://www.youtube.com/@EWSBascorroUNDIP"
              className="hover:text-white transition-colors"
            >
              <Youtube size={20} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 text-sm text-gray-400">
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/#about" className="hover:text-accent-yellow">
                  About
                </a>
              </li>
              <li>
                <a href="/#robots" className="hover:text-accent-yellow">
                  Robots
                </a>
              </li>
              <li>
                <a href="/#tech" className="hover:text-accent-yellow">
                  Technology
                </a>
              </li>
              <li>
                <a href="/#join" className="hover:text-accent-yellow">
                  Join Us
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-xs">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://wa.me/6287876638978"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-yellow"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a
                  href="https://mail.google.com/mail/?view=cm&to=ewsbascorro@gmail.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-yellow"
                >
                  Sponsorship
                </a>
              </li>
              <li>
                <a
                  href="https://undip.ac.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-yellow"
                >
                  UNDIP Official
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 mt-20 pt-8 text-center text-xs text-gray-600 font-mono">
        &copy; {new Date().getFullYear()} EWS BASCORRO TEAM. SYSTEM VERSION 4.2
      </div>
    </footer>
  );
}
