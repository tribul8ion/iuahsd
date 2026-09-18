import { filterNotes, filterProjects } from "../search";
import type { Entry } from "@/entities/entry";
import type { Project } from "@/entities/project";

const baseProject: Project = {
  id: 1,
  name: "Kitchen renovation",
  total: 4,
  done: 2,
  created_at: null,
  corrupted: false,
};

const baseNote: Entry = {
  id: 1,
  kind: "note",
  name: "Shopping list",
  doseAmount: null,
  doseUnit: null,
  notes: "Milk and eggs",
  schedule: "custom",
  time: "00:00",
  frequency_type: "none",
  interval_days: null,
  days_of_week: null,
  date_once: null,
  tag: null,
  color: null,
  start_date: null,
  active: true,
  notifications_enabled: true,
  muted_today: false,
  streak_current: 0,
  streak_best: 0,
  next_run_at: null,
  last_sent_at: null,
  created_at: "2026-01-01T00:00:00Z",
  pre_remind: null,
  project_id: null,
  done: null,
  corrupted: false,
};

describe("filterProjects", () => {
  it("returns all projects for an empty query", () => {
    const projects = [baseProject, { ...baseProject, id: 2, name: "Garden" }];
    expect(filterProjects(projects, "")).toEqual(projects);
    expect(filterProjects(projects, "   ")).toEqual(projects);
  });

  it("filters by a case-insensitive substring of the name", () => {
    const projects = [baseProject, { ...baseProject, id: 2, name: "Garden" }];
    expect(filterProjects(projects, "kitchen")).toEqual([baseProject]);
    expect(filterProjects(projects, "GARDEN")).toEqual([projects[1]]);
  });

  it("excludes corrupted projects even when the query is empty", () => {
    const corrupted = { ...baseProject, id: 3, corrupted: true };
    expect(filterProjects([baseProject, corrupted], "")).toEqual([baseProject, corrupted]);
    expect(filterProjects([baseProject, corrupted], "kitchen")).toEqual([baseProject]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterProjects([baseProject], "no such project")).toEqual([]);
  });
});

describe("filterNotes", () => {
  it("returns all notes for an empty query", () => {
    const notes = [baseNote, { ...baseNote, id: 2, name: "Trip plan" }];
    expect(filterNotes(notes, "")).toEqual(notes);
  });

  it("matches against the title", () => {
    expect(filterNotes([baseNote], "shopping")).toEqual([baseNote]);
    expect(filterNotes([baseNote], "trip")).toEqual([]);
  });

  it("matches against the body text", () => {
    expect(filterNotes([baseNote], "eggs")).toEqual([baseNote]);
  });

  it("excludes corrupted notes from search matches", () => {
    const corrupted = { ...baseNote, id: 4, corrupted: true, name: "shopping corrupted" };
    expect(filterNotes([baseNote, corrupted], "shopping")).toEqual([baseNote]);
  });
});
