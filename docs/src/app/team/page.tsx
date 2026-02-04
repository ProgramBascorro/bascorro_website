import fs from "fs";
import path from "path";
import TeamClient from "@/app/team/TeamClient";
import { TEAM_MEMBERS, type TeamMember } from "@/lib/team-data";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const FALLBACK_IMAGE = "/Logo_Bascorro.png";
const CSV_FILE_2026 = "database_ews_bascorro-2026.csv";
const CSV_FILE_2025 = "database_ews_bascorro-2025.csv";
const IMAGE_DIR_2026 = "team/2026";
const IMAGE_DIR_2025 = "team/2025"; // Directory might not exist yet, but logic handles it

type CsvRow = string[];

function parseCsv(content: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows.filter((cells) =>
    cells.some((cell) => cell.trim().length > 0)
  );
}

function extractDriveId(url: string) {
  if (!url) {
    return "";
  }

  const idMatch = /[?&]id=([^&]+)/.exec(url);
  if (idMatch?.[1]) {
    return idMatch[1];
  }

  const pathMatch = /\/d\/([^/]+)/.exec(url) ?? /\/file\/d\/([^/]+)/.exec(url);
  if (pathMatch?.[1]) {
    return pathMatch[1];
  }

  return "";
}

function resolveLocalImage(fileId: string, imageDir: string) {
  if (!fileId) {
    return FALLBACK_IMAGE;
  }

  const publicDir = path.join(process.cwd(), "public", imageDir);
  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = path.join(publicDir, `${fileId}${ext}`);
    if (fs.existsSync(candidate)) {
      return `/${imageDir}/${fileId}${ext}`;
    }
  }

  return FALLBACK_IMAGE;
}

function mapDivision(rawDivision: string): TeamMember["division"] {
  const value = rawDivision.toLowerCase();
  if (value.includes("programming") || value.includes("software")) {
    return "Software";
  }
  if (value.includes("elektrik") || value.includes("electrical") || value.includes("elektro")) {
    return "Electrical";
  }
  if (value.includes("mekanik") || value.includes("mechanical")) {
    return "Mechanical";
  }
  if (value.includes("official")) {
    return "Official";
  }
  if (value.includes("management") || value.includes("manajemen")) {
    return "Management";
  }
  return "Management";
}

function normalizeRole(rawDivision: string) {
  if (!rawDivision) {
    return "Member";
  }
  return rawDivision
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(" / ");
}

function loadTeamFromCsv(csvFile: string, year: number, imageDir: string): TeamMember[] {
  const csvPath = path.join(process.cwd(), csvFile);
  if (!fs.existsSync(csvPath)) {
    return [];
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const [headerRow, ...dataRows] = parseCsv(content);
  const headers = headerRow?.map((header) => header.trim()) ?? [];
  const headerIndex = new Map(headers.map((header, index) => [header, index]));

  const getValue = (row: CsvRow, header: string) => {
    const index = headerIndex.get(header);
    if (index === undefined) {
      return "";
    }
    return (row[index] ?? "").trim();
  };

  return dataRows.map((row, index) => {
    // Try to handle both 2025 and 2026 variations
    const fullName = getValue(row, "Nama Lengkap");
    const nickname = getValue(row, "Nama Panggilan") || getValue(row, "Nama Panggilan (Buat baju bisa)");
    const divisionRaw = getValue(row, "Divisi");
    const imageUrl = getValue(row, "Foto Diri (Bebas, Semi Formal)");
    const driveId = extractDriveId(imageUrl);
    const nim = getValue(row, "NIM");
    const angkatanRaw = getValue(row, "Angkatan");
    const funFact = getValue(row, "Fun Fact tentang kamu");
    const angkatan = Number.parseInt(angkatanRaw, 10);

    return {
      id: `${year}-${nim || index}`,
      name: fullName || nickname || `Member ${index + 1}`,
      role: normalizeRole(divisionRaw),
      division: mapDivision(divisionRaw),
      year: year,
      image: resolveLocalImage(driveId, imageDir),
      angkatan: Number.isFinite(angkatan) ? angkatan : undefined,
      funFact: funFact || undefined,
    } satisfies TeamMember;
  });
}

export default function TeamPage() {
  const team2026 = loadTeamFromCsv(CSV_FILE_2026, 2026, IMAGE_DIR_2026);
  const team2025 = loadTeamFromCsv(CSV_FILE_2025, 2025, IMAGE_DIR_2025);
  const legacyMembers = TEAM_MEMBERS.filter((member) => member.year < 2025);
  const mascot2026: TeamMember = {
    id: "2026-mascot",
    name: "Tammy",
    role: "Emotional Support",
    division: "Official",
    year: 2026,
    image: "/Tammy.jpeg",
    isMascot: true,
  };

  const members = [...team2026, mascot2026, ...team2025, ...legacyMembers];
  const years = Array.from(new Set(members.map((member) => member.year))).sort(
    (a, b) => b - a
  );
  const initialYear = years[0] ?? 2026;

  return (
    <TeamClient initialYear={initialYear} years={years} members={members} />
  );
}
