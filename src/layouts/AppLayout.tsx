// src/layouts/AppLayout.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  FiBell,
  FiCheck,
  FiChevronDown,
  FiFolder,
} from "react-icons/fi";
import {
  IoIosArrowDropdown,
  IoIosArrowDropup,
} from "react-icons/io";
import {
  LuArrowBigLeft,
  LuArrowBigRight,
} from "react-icons/lu";
import { VscSignOut } from "react-icons/vsc";

import { useAuth } from "@/auth/useAuth";
import IconButton from "@/components/sidebar/IconButton";
import Sidebar from "@/components/sidebar/Sidebar";
import {
  ProjectSelectionProvider,
  useProjectSelection,
} from "@/contexts/ProjectSelectionContext";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-(--background) text-(--foreground)">
      <Sidebar />

      <ProjectSelectionProvider>
        <AppLayoutContent />
      </ProjectSelectionProvider>
    </div>
  );
}

function AppLayoutContent() {
  const navigate = useNavigate();
  const {
    pathname,
    search,
  } = useLocation();
  const {
    logout,
    user,
  } = useAuth();
  const {
    projects,
    selectedProject,
    selectedProjectId,
    projectsLoading,
    projectsError,
    setSelectedProjectId,
  } = useProjectSelection();

  const sidebarCollapsed = useMemo(() => {
    const params =
      new URLSearchParams(search);

    return params.get("nav") === "collapsed";
  }, [search]);

  const toggleSidebar = () => {
    const params =
      new URLSearchParams(search);

    params.set(
      "nav",
      sidebarCollapsed
        ? "expanded"
        : "collapsed",
    );

    const nextSearch =
      params.toString();

    navigate(
      {
        pathname,
        search: nextSearch
          ? `?${nextSearch}`
          : "",
      },
      {
        replace: true,
      },
    );
  };

  const [profileMenuOpen, setProfileMenuOpen] =
    useState(false);
  const [projectMenuOpen, setProjectMenuOpen] =
    useState(false);
  const [signingOut, setSigningOut] =
    useState(false);

  const projectMenuRef =
    useRef<HTMLDivElement | null>(null);
  const profileMenuRef =
    useRef<HTMLDivElement | null>(null);

  const profileName = useMemo(() => {
    const explicitName =
      user?.name?.trim();

    if (explicitName) {
      return explicitName;
    }

    if (user?.role === "OWNER") {
      return "Admin";
    }

    const emailName =
      user?.email
        ?.split("@")[0]
        ?.trim();

    return emailName || "Utilisateur";
  }, [
    user?.email,
    user?.name,
    user?.role,
  ]);

  const profileInitials = useMemo(() => {
    const words = profileName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "U";
    }

    if (words.length === 1) {
      return words[0]
        .slice(0, 2)
        .toUpperCase();
    }

    return `${words[0][0]}${
      words[words.length - 1][0]
    }`.toUpperCase();
  }, [profileName]);

  const profileRoleLabel =
    user?.role === "OWNER"
      ? "Administrateur"
      : user?.role === "MEMBER"
        ? "Membre"
        : null;

  useEffect(() => {
    if (
      !profileMenuOpen &&
      !projectMenuOpen
    ) {
      return;
    }

    const handlePointerDown = (
      event: MouseEvent,
    ) => {
      const target =
        event.target as Node | null;

      if (!target) {
        return;
      }

      if (
        profileMenuOpen &&
        !profileMenuRef.current?.contains(target)
      ) {
        setProfileMenuOpen(false);
      }

      if (
        projectMenuOpen &&
        !projectMenuRef.current?.contains(target)
      ) {
        setProjectMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown,
      );
    };
  }, [
    profileMenuOpen,
    projectMenuOpen,
  ]);

  useEffect(() => {
    if (
      !profileMenuOpen &&
      !projectMenuOpen
    ) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setProjectMenuOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    profileMenuOpen,
    projectMenuOpen,
  ]);

  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setProfileMenuOpen(false);

    try {
      await logout();
    } finally {
      navigate("/login", {
        replace: true,
      });
      setSigningOut(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header
        className="
          pt-2 px-4 relative z-30
          flex shrink-0 flex-wrap
          items-center justify-between gap-3
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            icon={
              sidebarCollapsed ? (
                <LuArrowBigRight size={20} />
              ) : (
                <LuArrowBigLeft size={20} />
              )
            }
            onClick={toggleSidebar}
            ariaLabel={
              sidebarCollapsed
                ? "Ouvrir la barre latérale"
                : "Fermer la barre latérale"
            }
            floating={false}
            className="shrink-0"
          />

          <div
            className="
              inline-flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-md border border-emerald-200
              bg-emerald-50 text-emerald-800
            "
            aria-hidden="true"
          >
            <FiFolder size={18} />
          </div>

          <div
            ref={projectMenuRef}
            className="relative w-60 sm:w-64"
          >
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={projectMenuOpen}
              aria-controls="app-project-menu"
              aria-label="Sélectionner un projet"
              aria-invalid={
                projectsError ? true : undefined
              }
              title={
                projectsError ||
                selectedProject?.chantierName ||
                "Tous les projets"
              }
              disabled={projectsLoading}
              onClick={() => {
                setProfileMenuOpen(false);
                setProjectMenuOpen(
                  (current) => !current,
                );
              }}
              className={[
                "flex h-10 w-full items-center",
                "justify-between gap-3 px-3",
                "rounded-md border",
                "bg-emerald-50",
                "text-sm font-medium text-emerald-800",
                "transition-colors",
                "hover:bg-emerald-100",
                "disabled:cursor-wait",
                "disabled:opacity-70",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-emerald-400",
                projectMenuOpen
                  ? [
                      "border-emerald-400",
                      "ring-2 ring-emerald-400",
                    ].join(" ")
                  : "border-emerald-200",
              ].join(" ")}
            >
              <span className="min-w-0 truncate">
                {projectsLoading
                  ? "Chargement..."
                  : selectedProject?.chantierName ||
                    "Tous les projets"}
              </span>

              {projectMenuOpen ? (
                <IoIosArrowDropup
                  className="shrink-0"
                  size={18}
                  aria-hidden="true"
                />
              ) : (
                <IoIosArrowDropdown
                  className="shrink-0"
                  size={18}
                  aria-hidden="true"
                />
              )}
            </button>

            {projectMenuOpen &&
            !projectsLoading ? (
              <div
                id="app-project-menu"
                role="listbox"
                aria-label="Sélectionner un projet"
                className="
                  absolute left-0 top-full z-50 mt-1
                  w-full overflow-hidden
                  rounded-md border border-emerald-200
                  bg-white shadow-lg
                "
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={
                    selectedProjectId === ""
                  }
                  onClick={() => {
                    setSelectedProjectId("");
                    setProjectMenuOpen(false);
                  }}
                  className={[
                    "flex w-full items-center gap-3",
                    "px-3 py-2 text-left text-sm",
                    "transition-colors",
                    "hover:bg-emerald-50",
                    selectedProjectId === ""
                      ? [
                          "bg-emerald-50",
                          "text-emerald-800",
                        ].join(" ")
                      : "text-slate-700",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-4 w-4 shrink-0",
                      "items-center justify-center",
                      "rounded-sm border",
                      selectedProjectId === ""
                        ? [
                            "border-emerald-500",
                            "bg-emerald-500",
                            "text-white",
                          ].join(" ")
                        : [
                            "border-slate-300",
                            "bg-white",
                          ].join(" "),
                    ].join(" ")}
                  >
                    {selectedProjectId === "" ? (
                      <FiCheck
                        aria-hidden="true"
                        size={12}
                        strokeWidth={3}
                      />
                    ) : null}
                  </span>

                  <span className="truncate">
                    Tous les projets
                  </span>
                </button>

                {projects.map((project) => {
                  const selected =
                    project.id === selectedProjectId;

                  return (
                    <button
                      key={project.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setSelectedProjectId(
                          project.id,
                        );
                        setProjectMenuOpen(false);
                      }}
                      className={[
                        "flex w-full items-center gap-3",
                        "px-3 py-2 text-left text-sm",
                        "transition-colors",
                        "hover:bg-emerald-50",
                        selected
                          ? [
                              "bg-emerald-50",
                              "text-emerald-800",
                            ].join(" ")
                          : "text-slate-700",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-flex h-4 w-4 shrink-0",
                          "items-center justify-center",
                          "rounded-sm border",
                          selected
                            ? [
                                "border-emerald-500",
                                "bg-emerald-500",
                                "text-white",
                              ].join(" ")
                            : [
                                "border-slate-300",
                                "bg-white",
                              ].join(" "),
                        ].join(" ")}
                      >
                        {selected ? (
                          <FiCheck
                            aria-hidden="true"
                            size={12}
                            strokeWidth={3}
                          />
                        ) : null}
                      </span>

                      <span className="truncate">
                        {project.chantierName}
                      </span>
                    </button>
                  );
                })}

                {projects.length === 0 ? (
                  <div
                    className="
                      border-t border-emerald-100
                      px-3 py-2
                      text-xs text-slate-500
                    "
                  >
                    Aucun projet disponible.
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              title="Notifications"
              className="
                relative inline-flex h-10 w-10
                items-center justify-center
                rounded-full
                text-slate-700
                transition-colors
                hover:bg-slate-100
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-(--primary)
                focus-visible:ring-offset-2
              "
            >
              <FiBell
                aria-hidden="true"
                size={21}
              />
            </button>

            <div
              ref={profileMenuRef}
              className="relative"
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                aria-controls="app-profile-menu"
                onClick={() => {
                  setProjectMenuOpen(false);
                  setProfileMenuOpen(
                    (current) => !current,
                  );
                }}
                className="
                  flex items-center gap-2
                  rounded-lg px-2 py-1.5
                  text-left
                  transition-colors
                  hover:bg-slate-100
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-(--primary)
                  focus-visible:ring-offset-2
                "
              >
                <span
                  className="
                    inline-flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-(--primary)
                    text-sm font-semibold text-white
                  "
                  aria-hidden="true"
                >
                  {profileInitials}
                </span>

                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-40 truncate text-sm font-medium text-slate-800">
                    {profileName}
                  </span>
                </span>

                <FiChevronDown
                  aria-hidden="true"
                  size={17}
                  className={[
                    "text-slate-500 transition-transform",
                    profileMenuOpen
                      ? "rotate-180"
                      : "rotate-0",
                  ].join(" ")}
                />
              </button>

              {profileMenuOpen ? (
                <div
                  id="app-profile-menu"
                  role="menu"
                  aria-label="Menu du profil"
                  className="
                    absolute right-0 top-full z-50 mt-2
                    w-42 overflow-hidden
                    rounded-lg border border-slate-200
                    bg-white shadow-xl text-sm
                  "
                >
                  <div className="px-4 py-3">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {profileName}
                    </div>

                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {user?.email ?? "—"}
                    </div>

                    {profileRoleLabel ? (
                      <div className="mt-2 text-xs font-medium text-slate-600">
                        {profileRoleLabel}
                      </div>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-200" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    aria-busy={signingOut}
                    className="
                      flex w-full items-center gap-3
                      px-4 py-3
                      text-left text-sm
                      text-slate-700
                      transition-colors
                      hover:bg-slate-50
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                      focus-visible:outline-none
                      focus-visible:bg-slate-50
                    "
                  >
                    <VscSignOut
                      aria-hidden="true"
                      size={19}
                    />

                    <span>
                      {signingOut
                        ? "Déconnexion..."
                        : "Se déconnecter"}
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
        </div>
      </header>

      <main className="min-w-0 flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
