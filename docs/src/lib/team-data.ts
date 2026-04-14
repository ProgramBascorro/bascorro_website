export interface TeamMember {
  id: string;
  name: string;
  role: string;
  division:
    | "Management"
    | "Mechanic"
    | "Electronic"
    | "Software"
    | "Official"
    | "Advisor"
    | "Motion"
    | "Vision";
  year: number;
  image: string;
  nidn?: string;
  angkatan?: number;
  funFact?: string;
  socials?: {
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  isLead?: boolean;
  isMascot?: boolean;
}

export const TEAM_YEARS = [2026, 2025, 2024, 2023];

export const TEAM_MEMBERS: TeamMember[] = [
  // 2025 Team (Current)
  {
    id: "2025-0",
    name: "Laily Asna Safira, S.T., M.T.",
    role: "Team Advisor",
    division: "Advisor",
    year: 2025,
    isLead: true,
    image: "/laily_asna_safira.png",
    socials: { linkedin: "https://www.linkedin.com/in/laily-asna-safira-bb323a169/" },
  },
  {
    id: "2025-1",
    name: "Muhammad Farhan Suri",
    role: "Research Leader",
    division: "Management",
    year: 2025,
    isLead: true,
    image: "/team_leader.jpeg",
    socials: { linkedin: "https://www.linkedin.com/in/muhammad-farhan-suri-810a36291/" },
  },
  {
    id: "2025-9",
    name: "Hanadia Aulia Nisa",
    role: "Official Leader",
    division: "Management",
    year: 2025,
    isLead: true,
    image: "/Manager.jpeg",
    socials: { linkedin: "https://www.linkedin.com/in/hanadia-aulia-nisa-26721236b/" },
  },
  {
    id: "2025-2a",
    name: "Muhammad Fauzi Isnanto",
    role: "Head of Motion",
    division: "Motion",
    year: 2025,
    isLead: true,
    image: "/head_motion.jpeg",
    socials: { linkedin: "https://www.linkedin.com/in/muhammad-fauzi-isnanto/" },
  },
  {
    id: "2025-2b",
    name: "Banar Pambudi",
    role: "Head of Vision",
    division: "Vision",
    year: 2025,
    isLead: true,
    image: "/head_vision.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/banarpambudi/" },
  },
  {
    id: "2025-3",
    name: "Enrico Julianto",
    role: "Head of Mechanics",
    division: "Mechanic",
    year: 2025,
    isLead: true,
    image: "/head_mechanics.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/enrico-julian-wiguna-a3554a343/" },
  },
  {
    id: "2025-4",
    name: "Muhammad Fayyadh Ilham",
    role: "Head of Electronics",
    division: "Electronic",
    year: 2025,
    isLead: true,
    image: "/headElectric.jpeg",
    socials: { linkedin: "https://www.linkedin.com/in/mfayyadhilham/" },
  },
  {
    id: "2025-10",
    name: "Maria Vincentia Evelllyn Widhianto",
    role: "Head of Media",
    division: "Official",
    year: 2025,
    isLead: true,
    image: "/head_media.jpg",
    socials: { linkedin: "https://www.linkedin.com/in/evellyn-widhianto-081bb2320/" },
  },
  {
    id: "2025-11",
    name: "Alifiyah Afindina",
    role: "Head of Business Development",
    division: "Official",
    year: 2025,
    isLead: true,
    image: "/head_business_dev.jpeg",
    socials: { linkedin: "https://www.linkedin.com/in/alifiyah-afindina-296540330/" },
  },
  {
    id: "2025-5",
    name: "Budi Santoso",
    role: "Computer Vision Lead",
    division: "Vision",
    year: 2025,
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: "2025-6",
    name: "Dewi Lestari",
    role: "Public Relations",
    division: "Official",
    year: 2025,
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop",
  },
  {
    id: "2025-7",
    name: "Kevin Chen",
    role: "AI Engineer",
    division: "Motion",
    year: 2025,
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: "2025-8",
    name: "Maria Garcia",
    role: "Mechanical Design",
    division: "Mechanic",
    year: 2025,
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1887&auto=format&fit=crop",
  },

  // 2024 Team (Alumni/Past)
  {
    id: "2024-1",
    name: "Rizky Ramadhan",
    role: "Ex-Captain",
    division: "Management",
    year: 2024,
    isLead: true,
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "2024-2",
    name: "Jessica Wu",
    role: "Software Lead",
    division: "Software",
    year: 2024,
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop",
  },
  {
    id: "2024-3",
    name: "Ahmad Faisal",
    role: "Electrical Lead",
    division: "Electronic",
    year: 2024,
    image:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: "2024-4",
    name: "Ir. Hadha Afrisal, S.T., M.Sc., IPP.",
    role: "Ex Advisor",
    division: "Advisor",
    year: 2024,
    isLead: true,
    nidn: "H.7.199104172018071002",
    image: "/hadha_afrisal_1.jpg",
  },
];
