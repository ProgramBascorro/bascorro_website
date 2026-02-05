export const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Robots', href: '#robots' },
  { label: 'Tech', href: '#tech' },
  { label: 'Team', href: '#team' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Competitions', href: '/competitions' },
];

export const ROBOTS = [
  {
    name: "Robot 1",
    desc: "Our primary Goalkeeper unit built on the ROBOTIS OP3 platform, enhanced with custom kinematics.",
    specs: ["Height: 690 mm", "Weight: 5.1kg", "DOF: 20", "Middleware: ROS 2 Humble"],
    status: "Active",
    image: "/robot1.jpeg"
  },
  {
    name: "Robot 2",
    desc: "Next-gen Striker prototype featuring advanced trajectory prediction and stability control.",
    specs: ["Height: 690mm", "Weight: 5.8kg", "DOF: 20", "Middleware: ROS 2 Humble"],
    status: "Active",
    image: "/robot2.jpeg"
  }
];

export const COMPETITIONS = [
  {
    name: "RoboCup Humanoid League",
    role: "International Challenger",
    desc: "The premier international robotics competition. We aim to field a team of fully autonomous humanoid robots to play soccer against other university teams globally.",
    year: "Target 2026"
  },
  {
    name: "Kontes Robot Indonesia (KRI)",
    role: "Consistent National Finalist",
    desc: "Indonesia's premier robotics contest. We focus on the KRSBI-Humanoid division with a target to compete at the national stage in 2026.",
    year: "Target 2026"
  }
];

export const TECH_STACK = [
  {
    title: "Computer Vision",
    desc: "Real-time ball and field line detection using YOLO and custom color segmentation algorithms.",
    icon: "Eye"
  },
  {
    title: "Locomotion",
    desc: "Stable walking gaits and omnidirectional movement generators utilizing Inverse Kinematics.",
    icon: "Activity"
  },
  {
    title: "Strategy AI",
    desc: "Multi-agent coordination and role assignment (Striker, Goalie) using Behavior Trees.",
    icon: "Brain"
  },
  {
    title: "Simulation",
    desc: "Full physics simulation in Webots to test code safely before deployment on hardware.",
    icon: "Monitor"
  }
];

export const TEAM_DIVISIONS = [
  {
    name: "Management & Official",
    role: "Core Leadership",
    description: "Orchestrating the team's vision, handling logistics, branding, and maintaining relationships with the university and sponsors.",
    members: ["Team Leader", "Treasurer", "Secretary", "Sponsorship", "Fundraising", "Creative Media"],
    icon: "Users"
  },
  {
    name: "Mechanical Engineering",
    role: "Hardware Division",
    description: "Designing and fabricating the robot's physical structure, ensuring stability, durability, and optimal kinematics for soccer.",
    members: ["Lead Mechanical", "CAD Engineer", "Fabrication Specialist", "Material Analyst"],
    icon: "Wrench"
  },
  {
    name: "Electronics & Embedded",
    role: "Hardware Division",
    description: "Developing custom PCBs, managing power distribution systems, and integrating sensors (IMU, Servos) for real-time control.",
    members: ["Lead Electronics", "PCB Designer", "Embedded Engineer", "Wiring Specialist"],
    icon: "Zap"
  },
  {
    name: "Motion Division",
    role: "Kinematics & Control",
    description: "Developing advanced walking algorithms, balance control, and dynamic movement strategies.",
    members: ["Motion Lead", "Kinematics Eng.", "GameController", "Team Communication"],
    icon: "Activity"
  },
  {
    name: "Vision Division",
    role: "Perception & AI",
    description: "Implementing real-time object detection, localization, and field mapping using computer vision.",
    members: ["Vision Lead", "AI Specialist", "Localization"],
    icon: "Eye"
  }
];

export const FAQ_ITEMS = [
  {
    q: "Do I need robotics experience to join?",
    a: "No! We welcome students from all backgrounds (Informatics, Engineering, Physics). Passion and a willingness to learn are the most important traits."
  },
  {
    q: "Is this only for Engineering students?",
    a: "Not at all. We need diverse skills including management, media, and documentation. However, technical roles do require a strong foundation in logic/math."
  },
  {
    q: "How can I support the team?",
    a: "We are open to sponsorships and industrial partnerships. Please use the contact section below to reach out."
  }
];

export const TEAM_ACHIEVEMENTS = [
  {
    year: "2024",
    competition: "Kontes Robot Indonesia (KRI) National",
    result: "Top 8th National Competition",
    category: "KRSBI-Humanoid",
    level: "National"
  },
  {
    year: "2024",
    competition: "Kontes Robot Indonesia (KRI) Region II",
    result: "Top 6th Regional Competition",
    category: "KRSBI-Humanoid",
    level: "Regional"
  },
  {
    year: "2023",
    competition: "Kontes Robot Indonesia (KRI) National",
    result: "Top 10th National Competition",
    category: "KRSBI-Humanoid",
    level: "National"
  },
  {
    year: "2023",
    competition: "Kontes Robot Indonesia (KRI) Region II",
    result: "Top 6th Regional Competition",
    category: "KRSBI-Humanoid",
    level: "Regional"
  },
  {
    year: "2022",
    competition: "Kontes Robot Indonesia (KRI) Region I",
    result: "Runner Up Regional Competition",
    category: "KRSBI-Humanoid",
    level: "Regional"
  },
  {
    year: "2019",
    competition: "Kontes Robot Indonesia (KRI) Region I",
    result: "1st Runner Up Regional Competition",
    category: "KRSBI-Humanoid",
    level: "Regional"
  }
];
