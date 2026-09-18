import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search } from "lucide-react";
import { useEntries } from "@/entities/entry";
import type { Entry } from "@/entities/entry";
import { useProjects } from "@/entities/project";
import type { Project } from "@/entities/project";
import { NoteModal } from "@/features/manage-note";
import { PageHeader, Spinner } from "@/shared/ui";
import { filterNotes, filterProjects } from "../model/search";
import { useDebouncedValue } from "../model/use-debounced-value";
import { ProjectCard } from "./ProjectCard";
import { NoteRow } from "./NoteRow";
import { ProjectSheet } from "./ProjectSheet";
import { CreateProjectModal } from "./CreateProjectModal";

const SEARCH_DEBOUNCE_MS = 200;

export function PlansPage() {
  const { t } = useTranslation();
  const { data: entries, isLoading: entriesLoading } = useEntries();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const [searchInput, setSearchInput] = useState("");
  const debouncedQuery = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedNote, setSelectedNote] = useState<Entry | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

  const notes = useMemo(
    () => entries?.filter((e) => e.kind === "note") ?? [],
    [entries]
  );

  const allProjects = useMemo(() => projects ?? [], [projects]);

  const filteredProjects = useMemo(
    () => filterProjects(allProjects, debouncedQuery),
    [allProjects, debouncedQuery]
  );
  const filteredNotes = useMemo(
    () => filterNotes(notes, debouncedQuery),
    [notes, debouncedQuery]
  );

  const totalCount = allProjects.length + notes.length;
  const isLoading = entriesLoading || projectsLoading;
  const hasQuery = debouncedQuery.trim().length > 0;
  const hasNoResults =
    hasQuery && filteredProjects.length === 0 && filteredNotes.length === 0;

  return (
    <div className="min-h-full" style={{ paddingBottom: "calc(96px + 16px + env(safe-area-inset-bottom))" }}>
      <PageHeader
        title={t("plans.title")}
        subtitle={t("plans.items_count", { count: totalCount })}
        height={140}
      />

      <div className="flex flex-col" style={{ padding: "16px 16px 0 16px", gap: 20 }}>
        <div
          className="flex items-center glass rounded-[24px]"
          style={{ gap: 10, padding: "0 14px", height: 48 }}
        >
          <Search size={18} color="#A8A29E" strokeWidth={1.8} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("plans.search_placeholder")}
            aria-label="plans-search"
            className="w-full text-[14px] bg-transparent outline-none placeholder:text-[#A8A29E]"
            style={{ color: "#1C1917" }}
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <>
            {hasNoResults && (
              <p className="text-[13px] text-center" style={{ color: "#A8A29E", padding: "16px 0" }}>
                {t("plans.no_results")}
              </p>
            )}

            {!hasNoResults && (
              <>
                <section className="flex flex-col" style={{ gap: 10 }}>
                  <div className="flex items-center justify-between">
                    <p
                      className="text-[11px] font-semibold uppercase"
                      style={{ color: "#A8A29E", letterSpacing: "1px" }}
                    >
                      {t("plans.projects_section")}
                    </p>
                    <button
                      onClick={() => setIsCreateProjectOpen(true)}
                      className="flex items-center justify-center cursor-pointer rounded-full"
                      style={{ width: 26, height: 26, backgroundColor: "#ECFDF5" }}
                      aria-label="create-project"
                    >
                      <Plus size={15} color="#059669" strokeWidth={2.2} />
                    </button>
                  </div>

                  {filteredProjects.length === 0 ? (
                    <p className="text-[13px]" style={{ color: "#A8A29E", padding: "4px 2px" }}>
                      {t("plans.empty_projects")}
                    </p>
                  ) : (
                    <div className="flex flex-col" style={{ gap: 8 }}>
                      {filteredProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onClick={() => setSelectedProject(project)}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section className="flex flex-col" style={{ gap: 10 }}>
                  <div className="flex items-center justify-between">
                    <p
                      className="text-[11px] font-semibold uppercase"
                      style={{ color: "#A8A29E", letterSpacing: "1px" }}
                    >
                      {t("plans.notes_section")}
                    </p>
                    <button
                      onClick={() => setIsAddNoteOpen(true)}
                      className="flex items-center justify-center cursor-pointer rounded-full"
                      style={{ width: 26, height: 26, backgroundColor: "#ECFDF5" }}
                      aria-label="create-note"
                    >
                      <Plus size={15} color="#059669" strokeWidth={2.2} />
                    </button>
                  </div>

                  {filteredNotes.length === 0 ? (
                    <p className="text-[13px]" style={{ color: "#A8A29E", padding: "4px 2px" }}>
                      {t("plans.empty_notes")}
                    </p>
                  ) : (
                    <div className="flex flex-col" style={{ gap: 8 }}>
                      {filteredNotes.map((note) => (
                        <NoteRow
                          key={note.id}
                          note={note}
                          onClick={() => setSelectedNote(note)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>

      {selectedProject && (
        <ProjectSheet
          key={selectedProject.id}
          project={selectedProject}
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {selectedNote && (
        <NoteModal
          key={selectedNote.id}
          note={selectedNote}
          isOpen={!!selectedNote}
          onClose={() => setSelectedNote(null)}
        />
      )}

      {isAddNoteOpen && (
        <NoteModal isOpen={isAddNoteOpen} onClose={() => setIsAddNoteOpen(false)} />
      )}

      <CreateProjectModal
        key={isCreateProjectOpen ? "open" : "closed"}
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />
    </div>
  );
}
