import type { Entry } from "@/entities/entry";
import type { Project } from "@/entities/project";

export function filterProjects(projects: readonly Project[], query: string): Project[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...projects];
  return projects.filter((p) => !p.corrupted && p.name.toLowerCase().includes(q));
}

export function filterNotes(notes: readonly Entry[], query: string): Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...notes];
  return notes.filter(
    (n) =>
      !n.corrupted &&
      (n.name.toLowerCase().includes(q) || (n.notes ?? "").toLowerCase().includes(q))
  );
}
