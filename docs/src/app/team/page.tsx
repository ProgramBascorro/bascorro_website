import TeamClient from "@/app/team/TeamClient";
import team2025Data from "@/data/team-2025.json";
import team2026Data from "@/data/team-2026.json";
import { TEAM_MEMBERS, type TeamMember } from "@/lib/team-data";
import {
  TEAM_2024_FOLDER_MEMBERS,
  TEAM_2024_FOLDER_TO_DIVISION,
  TEAM_IMAGE_EXTENSION_BY_YEAR,
} from "@/lib/team-image-manifest";

const FALLBACK_IMAGE = "/Logo_Bascorro.png";
const IMAGE_DIR_2026 = "team/2026";
const IMAGE_DIR_2025 = "team/2025";
const IMAGE_DIR_2024 = "team/2024";

const TEAM_2024_ROLE_MAP: Record<TeamMember["division"], string> = {
  Management: "Management",
  Mechanic: "Mechanic",
  Electronic: "Electronic",
  Software: "Programming",
  Official: "Official",
  Advisor: "Advisor",
  Motion: "Motion",
  Vision: "Vision",
};
const TEAM_2024_ROLE_OVERRIDES: Record<string, string> = {
  "ahmad nadhif masruri": "Programming / Electronic / Mechanic / Official",
};

interface CsvMemberRecord {
  angkatan: number | null;
  divisionRaw: string;
  fullName: string;
  funFact: string | null;
  imageUrl: string;
  nickname: string;
  nim: string;
}

function normalizeAngkatanValue(angkatan: number | null): number | undefined {
  if (typeof angkatan !== "number" || !Number.isFinite(angkatan)) {
    return undefined;
  }

  if (angkatan >= 0 && angkatan < 100) {
    return 2000 + angkatan;
  }

  return angkatan;
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

function resolveLocalImage(fileId: string, imageDir: string, year: number) {
  if (!fileId) {
    return FALLBACK_IMAGE;
  }

  const ext = TEAM_IMAGE_EXTENSION_BY_YEAR[year]?.[fileId];
  return ext ? `/${imageDir}/${fileId}${ext}` : FALLBACK_IMAGE;
}

function mapDivision(rawDivision: string): TeamMember["division"] {
  const value = rawDivision.toLowerCase();
  if (value.includes("programming") || value.includes("software")) {
    return "Software";
  }
  if (value.includes("elektrik") || value.includes("electrical") || value.includes("elektro")) {
    return "Electronic";
  }
  if (value.includes("mekanik") || value.includes("mechanical")) {
    return "Mechanic";
  }
  if (value.includes("official")) {
    return "Official";
  }
  if (value.includes("management") || value.includes("manajemen")) {
    return "Management";
  }
  return "Management";
}

function normalizeRoleToken(token: string): string | null {
  const value = token.toLowerCase().trim();
  if (value.includes("programming") || value.includes("software")) {
    return "Programming";
  }
  if (value.includes("elektrik") || value.includes("electrical") || value.includes("elektro")) {
    return "Electronic";
  }
  if (value.includes("mekanik") || value.includes("mechanic") || value.includes("mechanical")) {
    return "Mechanic";
  }
  if (value.includes("official")) {
    return "Official";
  }
  if (value.includes("management") || value.includes("manajemen")) {
    return "Management";
  }
  if (value.includes("advisor")) {
    return "Advisor";
  }
  if (value.includes("vision")) {
    return "Vision";
  }
  if (value.includes("motion")) {
    return "Motion";
  }
  return null;
}

function normalizeRole(rawDivision: string, division: TeamMember["division"]) {
  const mapped = rawDivision
    .split(/[,|/;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(normalizeRoleToken)
    .filter((role): role is string => Boolean(role));

  const uniqueMapped = Array.from(new Set(mapped));
  if (uniqueMapped.length > 0) {
    return uniqueMapped.join(" / ");
  }
  return TEAM_2024_ROLE_MAP[division];
}

function loadTeamFromRows(
  rows: CsvMemberRecord[],
  year: number,
  imageDir: string,
): TeamMember[] {
  return rows.map((row, index) => {
    const divisionRaw = row.divisionRaw ?? "";
    const driveId = extractDriveId(row.imageUrl ?? "");
    const normalizedAngkatan = normalizeAngkatanValue(row.angkatan);
    const mappedDivision = mapDivision(divisionRaw);

    return {
      id: `${year}-${row.nim || index}`,
      name: row.fullName || row.nickname || `Member ${index + 1}`,
      role: normalizeRole(divisionRaw, mappedDivision),
      division: mappedDivision,
      year,
      image: resolveLocalImage(driveId, imageDir, year),
      angkatan: normalizedAngkatan,
      funFact: row.funFact || undefined,
    } satisfies TeamMember;
  });
}

function loadTeamFromFolder(year: number, imageDir: string): TeamMember[] {
  return TEAM_2024_FOLDER_MEMBERS.map((member) => {
    const division = TEAM_2024_FOLDER_TO_DIVISION[member.folder];
    const encodedFolder = encodeURIComponent(member.folder);
    const encodedFile = encodeURIComponent(member.file);
    return {
      id: `${year}-${division}-${member.name}`.toLowerCase().replace(/\s+/g, "-"),
      name: member.name,
      role:
        TEAM_2024_ROLE_OVERRIDES[member.name.toLowerCase()] ??
        TEAM_2024_ROLE_MAP[division],
      division,
      year,
      image: `/${imageDir}/${encodedFolder}/${encodedFile}`,
      angkatan: member.angkatan,
    } satisfies TeamMember;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export default function TeamPage() {
  const team2026 = loadTeamFromRows(team2026Data as CsvMemberRecord[], 2026, IMAGE_DIR_2026);
  const team2025 = loadTeamFromRows(team2025Data as CsvMemberRecord[], 2025, IMAGE_DIR_2025);
  const team2024 = loadTeamFromFolder(2024, IMAGE_DIR_2024);
  const advisors2024 = TEAM_MEMBERS.filter(
    (member) => member.year === 2024 && member.division === "Advisor",
  );
  const legacyMembers = TEAM_MEMBERS.filter((member) => member.year < 2024);
  const mascot2026: TeamMember = {
    id: "2026-mascot",
    name: "Tammy",
    role: "Emotional Support",
    division: "Official",
    year: 2026,
    image: "/Tammy.jpeg",
    isMascot: true,
  };

  const members = [
    ...team2026,
    mascot2026,
    ...team2025,
    ...team2024,
    ...advisors2024,
    ...legacyMembers,
  ];
  const years = Array.from(new Set(members.map((member) => member.year))).sort(
    (a, b) => b - a
  );
  const initialYear = years[0] ?? 2026;

  return (
    <TeamClient initialYear={initialYear} years={years} members={members} />
  );
}
