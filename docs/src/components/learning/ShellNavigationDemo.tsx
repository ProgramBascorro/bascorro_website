"use client";

import {
  ShellCommandSimulator,
  type ScenarioStep,
} from "./ShellCommandSimulator";

const navigationScenario: ScenarioStep[] = [
  {
    id: "nav-1",
    instruction: "Cek posisi folder aktif dengan command yang tepat.",
    acceptedCommands: ["pwd"],
    output: ["/data/data/com.termux/files/home/projects/bascorro_web"],
  },
  {
    id: "nav-2",
    instruction: "Lihat isi folder saat ini secara detail.",
    acceptedCommands: ["ls -la"],
    output: ["docs  ros_ws  scripts  README.md  AGENTS.md"],
  },
  {
    id: "nav-3",
    instruction: "Masuk ke folder docs.",
    acceptedCommands: ["cd docs"],
    output: [],
    onSuccessState: {
      cwd: "/data/data/com.termux/files/home/projects/bascorro_web/docs",
    },
  },
  {
    id: "nav-4",
    instruction: "Verifikasi sekarang ada di folder docs.",
    acceptedCommands: ["pwd"],
    output: ["/data/data/com.termux/files/home/projects/bascorro_web/docs"],
  },
  {
    id: "nav-5",
    instruction: "Pindah ke ros_ws menggunakan path relatif dari docs.",
    acceptedCommands: ["cd ../ros_ws"],
    output: [],
    onSuccessState: {
      cwd: "/data/data/com.termux/files/home/projects/bascorro_web/ros_ws",
    },
  },
  {
    id: "nav-6",
    instruction: "Cek lagi posisi akhir folder aktif.",
    acceptedCommands: ["pwd"],
    output: ["/data/data/com.termux/files/home/projects/bascorro_web/ros_ws"],
  },
];

export function ShellNavigationDemo() {
  return (
    <ShellCommandSimulator
      title="Interactive Demo: Navigation Drill"
      scenario={navigationScenario}
      hints={[
        "Gunakan command paling dasar: pwd, ls, cd.",
        "Setelah cd, verifikasi lagi dengan pwd.",
        "Path relatif dari docs ke ros_ws adalah ../ros_ws.",
      ]}
    />
  );
}
