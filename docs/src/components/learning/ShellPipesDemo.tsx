"use client";

import {
  ShellCommandSimulator,
  type ScenarioStep,
} from "./ShellCommandSimulator";

const pipesScenario: ScenarioStep[] = [
  {
    id: "pipe-1",
    instruction: "Filter history untuk command yang berhubungan dengan ros2.",
    acceptedCommands: ["history | grep ros2"],
    output: ["142  ros2 topic list", "190  ros2 node list", "211  ros2 launch ..."],
  },
  {
    id: "pipe-2",
    instruction:
      "Hitung jumlah kemunculan teks `source install/setup.bash` di docs.",
    acceptedCommands: [
      "rg \"source install/setup.bash\" docs/content/docs | wc -l",
      "rg 'source install/setup.bash' docs/content/docs | wc -l",
    ],
    output: ["7"],
  },
  {
    id: "pipe-3",
    instruction: "Redirect output ls ke file notes_ls.txt (overwrite).",
    acceptedCommands: ["ls -la > notes_ls.txt"],
    output: ["(output disimpan ke notes_ls.txt)"],
    onSuccessState: {
      files: {
        "notes_ls.txt": "file",
      },
    },
  },
  {
    id: "pipe-4",
    instruction: "Append tanggal ke file notes_ls.txt.",
    acceptedCommands: ["date >> notes_ls.txt"],
    output: ["(baris tanggal ditambahkan ke notes_ls.txt)"],
  },
];

export function ShellPipesDemo() {
  return (
    <ShellCommandSimulator
      title="Interactive Demo: Filter & Redirect Lab"
      scenario={pipesScenario}
      hints={[
        "Ingat perbedaan: > menimpa file, >> menambahkan isi.",
        "Gunakan pipe | untuk menghubungkan output command.",
        "Untuk step 2, urutannya: rg ... | wc -l.",
      ]}
    />
  );
}
