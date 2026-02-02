export interface TeamMember {
  id: string;
  name: string;
  role: string;
  division:
    | "Management"
    | "Mechanical"
    | "Electrical"
    | "Software"
    | "Official"
    | "Advisor";
  year: number;
  image: string;
  socials?: {
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  isLead?: boolean;
}

export const TEAM_YEARS = [2025, 2024, 2023];

export const TEAM_MEMBERS: TeamMember[] = [
  // 2025 Team (Current)
  {
    id: "2025-0",
    name: "Laily Asna Safira, S.T., M.T.",
    role: "Faculty Advisor",
    division: "Advisor",
    year: 2025,
    isLead: true,
    image: "/laily_asna_safira.png",
    socials: { linkedin: "#" },
  },
  {
    id: "2025-1",
    name: "Arya Wijaya",
    role: "Team Captain",
    division: "Management",
    year: 2025,
    isLead: true,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop",
    socials: { linkedin: "#", github: "#" },
  },
  {
    id: "2025-2",
    name: "Sarah Putri",
    role: "Head of Software",
    division: "Software",
    year: 2025,
    isLead: true,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop",
    socials: { linkedin: "#", github: "#" },
  },
  {
    id: "2025-3",
    name: "Dimas Pratama",
    role: "Head of Mechanics",
    division: "Mechanical",
    year: 2025,
    isLead: true,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop",
    socials: { linkedin: "#" },
  },
  {
    id: "2025-4",
    name: "Muhamad Fayad",
    role: "Head of Electronics",
    division: "Electrical",
    year: 2025,
    isLead: true,
    image: "/headElectric.jpeg",
    socials: { linkedin: "http://linkedin.com/in/mfayyadhilham" },
  },
  {
    id: "2025-5",
    name: "Budi Santoso",
    role: "Computer Vision Lead",
    division: "Software",
    year: 2025,
    image:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1887&auto=format&fit=crop",
    socials: { github: "#" },
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
    division: "Software",
    year: 2025,
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop",
  },
  {
    id: "2025-8",
    name: "Maria Garcia",
    role: "Mechanical Design",
    division: "Mechanical",
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
    division: "Electrical",
    year: 2024,
    image:
      "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=1887&auto=format&fit=crop",
  },
];
