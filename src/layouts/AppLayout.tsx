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
import {
  compressionApi,
  isCompressionApiError,
  type CompressionPlanningEventDTO,
} from "@/lib/compressionApi";

const DISMISSED_NOTIFICATIONS_KEY_PREFIX =
  "projectbt:calendar-notifications:dismissed:";

function formatLocalDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(
    value.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    value.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatNotificationDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("fr-FR");
}

function getNotificationDismissalKey(
  event: CompressionPlanningEventDTO,
): string {
  return [
    event.id,
    event.crushingDate,
    event.planningTime,
  ].join("|");
}

function isStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry: unknown) =>
        typeof entry === "string",
    )
  );
}

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
  const [
    notificationMenuOpen,
    setNotificationMenuOpen,
  ] = useState(false);
  const [
    calendarNotifications,
    setCalendarNotifications,
  ] = useState<CompressionPlanningEventDTO[]>([]);
  const [
    notificationsLoading,
    setNotificationsLoading,
  ] = useState(false);
  const [
    notificationsError,
    setNotificationsError,
  ] = useState("");
  const [
    dismissedNotificationKeys,
    setDismissedNotificationKeys,
  ] = useState<Set<string>>(() => new Set());
  const [signingOut, setSigningOut] =
    useState(false);

  const projectMenuRef =
    useRef<HTMLDivElement | null>(null);
  const profileMenuRef =
    useRef<HTMLDivElement | null>(null);
  const notificationMenuRef =
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

  const visibleNotifications = useMemo(
    () =>
      calendarNotifications.filter(
        (notification) =>
          !dismissedNotificationKeys.has(
            getNotificationDismissalKey(
              notification,
            ),
          ),
      ),
    [
      calendarNotifications,
      dismissedNotificationKeys,
    ],
  );

  const notificationCount =
    visibleNotifications.length;

  async function loadCalendarNotifications(
    isCancelled?: () => boolean,
  ) {
    if (!user?.id) {
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError("");

    try {
      const from =
        formatLocalDateOnly(new Date());
      const response =
        await compressionApi.listPlanningEvents(
          from,
        );

      if (isCancelled?.()) {
        return;
      }

      setCalendarNotifications(response.items);
    } catch (loadError: unknown) {
      if (isCancelled?.()) {
        return;
      }

      setNotificationsError(
        isCompressionApiError(loadError)
          ? loadError.message
          : "Impossible de charger les notifications.",
      );
    } finally {
      if (!isCancelled?.()) {
        setNotificationsLoading(false);
      }
    }
  }

  function dismissNotification(
    notification: CompressionPlanningEventDTO,
  ) {
    if (!user?.id) {
      return;
    }

    const dismissalKey =
      getNotificationDismissalKey(notification);
    const nextSet = new Set(
      dismissedNotificationKeys,
    );
    nextSet.add(dismissalKey);
    setDismissedNotificationKeys(nextSet);

    try {
      const storageKey =
        `${DISMISSED_NOTIFICATIONS_KEY_PREFIX}${user.id}`;
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(Array.from(nextSet)),
      );
    } catch {
      // Keep the in-memory dismissal when storage is unavailable.
    }
  }

  useEffect(() => {
    if (!user?.id) {
      setDismissedNotificationKeys(new Set());
      return;
    }

    const storageKey =
      `${DISMISSED_NOTIFICATIONS_KEY_PREFIX}${user.id}`;
    let nextKeys = new Set<string>();

    try {
      const rawValue =
        window.localStorage.getItem(storageKey);

      if (rawValue) {
        const parsed: unknown =
          JSON.parse(rawValue);

        if (isStringArray(parsed)) {
          nextKeys = new Set(parsed);
        }
      }
    } catch {
      nextKeys = new Set();
    }

    setDismissedNotificationKeys(nextKeys);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setCalendarNotifications([]);
      setNotificationsLoading(false);
      setNotificationsError("");
      return;
    }

    let cancelled = false;

    void loadCalendarNotifications(
      () => cancelled,
    );

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (
      !profileMenuOpen &&
      !projectMenuOpen &&
      !notificationMenuOpen
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

      if (
        notificationMenuOpen &&
        !notificationMenuRef.current?.contains(
          target,
        )
      ) {
        setNotificationMenuOpen(false);
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
    notificationMenuOpen,
  ]);

  useEffect(() => {
    if (
      !profileMenuOpen &&
      !projectMenuOpen &&
      !notificationMenuOpen
    ) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
        setProjectMenuOpen(false);
        setNotificationMenuOpen(false);
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
    notificationMenuOpen,
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
                setNotificationMenuOpen(false);
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
          <div
            ref={notificationMenuRef}
            className="relative"
          >
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={notificationMenuOpen}
              aria-controls="app-notifications-menu"
              aria-label={
                notificationCount > 0
                  ? `Notifications, ${notificationCount} non traitées`
                  : "Notifications"
              }
              title="Notifications"
              onClick={() => {
                setProjectMenuOpen(false);
                setProfileMenuOpen(false);

                const next =
                  !notificationMenuOpen;
                setNotificationMenuOpen(next);

                if (
                  next &&
                  !notificationsLoading
                ) {
                  void loadCalendarNotifications();
                }
              }}
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

              {notificationCount > 0 ? (
                <span
                  className="
                    absolute -right-0.5 -top-0.5
                    inline-flex min-w-5 h-5
                    items-center justify-center
                    rounded-full bg-red-600 px-1
                    text-[10px] font-bold text-white
                  "
                  aria-hidden="true"
                >
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </span>
              ) : null}
            </button>

            {notificationMenuOpen ? (
              <div
                id="app-notifications-menu"
                role="dialog"
                aria-label="Notifications du calendrier"
                className="
                  absolute right-0 top-full z-50 mt-2
                  w-96 max-w-[calc(100vw-2rem)]
                  overflow-hidden rounded-lg
                  border border-slate-200
                  bg-white shadow-xl
                "
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <div className="font-semibold text-slate-900">
                    Notifications
                  </div>
                  <div className="text-xs text-slate-500">
                    {notificationCount} non traitée
                    {notificationCount === 1
                      ? ""
                      : "s"}
                  </div>
                </div>

                {notificationsLoading ? (
                  <div className="border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
                    Chargement des notifications...
                  </div>
                ) : null}

                {notificationsError ? (
                  <div
                    role="alert"
                    className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {notificationsError}
                  </div>
                ) : null}

                {!notificationsLoading &&
                visibleNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    Aucune notification.
                  </div>
                ) : null}

                {visibleNotifications.length > 0 ? (
                  <div className="max-h-96 divide-y divide-slate-200 overflow-y-auto">
                    {visibleNotifications.map(
                      (notification) => (
                        <div
                          key={getNotificationDismissalKey(
                            notification,
                          )}
                          className="flex items-start gap-3 px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900">
                              Écrasement –{" "}
                              {
                                notification.designation
                              }
                            </div>

                            <div className="mt-1 truncate text-sm text-slate-600">
                              {
                                notification.projectName
                              }
                            </div>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                              <span>
                                {formatNotificationDate(
                                  notification.crushingDate,
                                )}
                              </span>
                              <span aria-hidden="true">
                                •
                              </span>
                              <span>
                                {
                                  notification.planningTime
                                }
                              </span>
                            </div>

                            {notification.reportTitle ? (
                              <div className="mt-1 truncate text-xs text-slate-500">
                                Rapport :{" "}
                                {
                                  notification.reportTitle
                                }
                              </div>
                            ) : null}

                            {notification.reference ? (
                              <div className="mt-1 truncate text-xs text-slate-500">
                                Référence :{" "}
                                {
                                  notification.reference
                                }
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            title="Marquer comme traité"
                            aria-label={`Marquer la notification ${notification.designation} comme traitée`}
                            onClick={() => {
                              dismissNotification(
                                notification,
                              );
                            }}
                            className="
                              inline-flex h-8 w-8 shrink-0
                              items-center justify-center
                              rounded-full border
                              border-emerald-300
                              text-emerald-700
                              transition-colors
                              hover:border-emerald-600
                              hover:bg-emerald-600
                              hover:text-white
                              focus-visible:outline-none
                              focus-visible:ring-2
                              focus-visible:ring-emerald-400
                              focus-visible:ring-offset-2
                            "
                          >
                            <FiCheck
                              aria-hidden="true"
                              size={17}
                              strokeWidth={2.5}
                            />
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

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
                  setNotificationMenuOpen(false);
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
