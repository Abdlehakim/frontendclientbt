import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ferraillageApi,
  isApiError as isFerraillageApiError,
  type FerRapportDTO,
} from "@/lib/ferraillageApi";

const PROJECT_SELECTION_STORAGE_KEY =
  "smartwebify:selected-project-id";

export type ProjectSelectionContextValue = {
  projects: FerRapportDTO[];
  selectedProjectId: string;
  selectedProject: FerRapportDTO | null;
  projectsLoading: boolean;
  projectsError: string;
  setSelectedProjectId: (projectId: string) => void;
};

const ProjectSelectionContext =
  createContext<ProjectSelectionContextValue | null>(null);

function readStoredProjectId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(
      PROJECT_SELECTION_STORAGE_KEY,
    );
  } catch {
    return null;
  }
}

function storeProjectId(projectId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PROJECT_SELECTION_STORAGE_KEY,
      projectId,
    );
  } catch {
    // Keep the selector usable when storage is unavailable.
  }
}

function removeStoredProjectId(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(
      PROJECT_SELECTION_STORAGE_KEY,
    );
  } catch {
    // Keep the selector usable when storage is unavailable.
  }
}

export function ProjectSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [projects, setProjects] = useState<FerRapportDTO[]>([]);
  const [selectedProjectIdState, setSelectedProjectIdState] =
    useState("");
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");

  useEffect(() => {
    let active = true;

    void ferraillageApi
      .listProjects()
      .then((response) => {
        if (!active) {
          return;
        }

        const loadedProjects = [...response.items].sort(
          (left, right) =>
            left.chantierName.localeCompare(
              right.chantierName,
              "fr",
            ),
        );
        const storedProjectId = readStoredProjectId();
        const storedProjectExists =
          Boolean(storedProjectId) &&
          loadedProjects.some(
            (project) => project.id === storedProjectId,
          );

        setProjects(loadedProjects);
        setProjectsError("");

        if (storedProjectExists && storedProjectId) {
          setSelectedProjectIdState(storedProjectId);
        } else {
          setSelectedProjectIdState("");

          if (storedProjectId) {
            removeStoredProjectId();
          }
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setProjects([]);
        setSelectedProjectIdState("");
        setProjectsError(
          isFerraillageApiError(error)
            ? error.message
            : "Impossible de charger les projets.",
        );
      })
      .finally(() => {
        if (active) {
          setProjectsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const setSelectedProjectId = useCallback(
    (projectId: string) => {
      setSelectedProjectIdState(projectId);
      storeProjectId(projectId);
    },
    [],
  );

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) => project.id === selectedProjectIdState,
      ) ?? null,
    [projects, selectedProjectIdState],
  );

  const value = useMemo<ProjectSelectionContextValue>(
    () => ({
      projects,
      selectedProjectId: selectedProjectIdState,
      selectedProject,
      projectsLoading,
      projectsError,
      setSelectedProjectId,
    }),
    [
      projects,
      projectsError,
      projectsLoading,
      selectedProject,
      selectedProjectIdState,
      setSelectedProjectId,
    ],
  );

  return (
    <ProjectSelectionContext.Provider value={value}>
      {children}
    </ProjectSelectionContext.Provider>
  );
}

export function useProjectSelection(): ProjectSelectionContextValue {
  const context = useContext(ProjectSelectionContext);

  if (!context) {
    throw new Error(
      "useProjectSelection must be used within a ProjectSelectionProvider.",
    );
  }

  return context;
}
