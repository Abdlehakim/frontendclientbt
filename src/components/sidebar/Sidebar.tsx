import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { LuArrowBigLeft, LuArrowBigRight } from "react-icons/lu";
import { BiChevronRight, BiChevronDown, BiChevronUp } from "react-icons/bi";
import { VscSignOut } from "react-icons/vsc";
import { FaBars } from "react-icons/fa6";

import IconButton from "@/components/sidebar/IconButton";
import { sidebarItems, type SidebarItem } from "@/components/sidebar/sidebarItems";
import { useAuth } from "@/auth/useAuth";

const normalizePath = (s?: string) => {
  if (!s) return "";
  const noTrail = s.replace(/\/+$/, "");
  return noTrail.length ? noTrail : "/";
};

const collectHrefs = (items?: SidebarItem[]): string[] => {
  const out: string[] = [];
  items?.forEach((it) => {
    if (it.to) out.push(it.to);
    if (it.children) out.push(...collectHrefs(it.children));
  });
  return out;
};

export default function Sidebar() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { logout, user } = useAuth();

  const [collapsed, setCollapsed] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [signingOut, setSigningOut] = useState(false);

  const navRef = useRef<HTMLDivElement | null>(null);
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);
  const [atTop, setAtTop] = useState(true);

  const closeIfMobile = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setCollapsed(true);
    }
  }, []);

  const isHrefActive = useCallback(
    (to?: string) => {
      if (!to) return false;
      const cur = normalizePath(pathname || "/");
      const target = normalizePath(to);
      if (target === "/app") return cur === target;
      return cur === target || cur.startsWith(target + "/");
    },
    [pathname]
  );

  const isSectionActive = useCallback(
    (item: SidebarItem): boolean => {
      if (isHrefActive(item.to)) return true;
      if (item.children?.length) return item.children.some(isSectionActive);
      return false;
    },
    [isHrefActive]
  );

  useEffect(() => {
    const current = normalizePath(pathname || "/");
    const next: Record<string, boolean> = {};
    sidebarItems.forEach((item) => {
      if (!item.children) return;
      const hrefs = collectHrefs(item.children).map(normalizePath);
      const match = hrefs.some((h) => current === h || current.startsWith(h + "/"));
      if (match) next[item.name] = true;
    });
    setExpanded(next);
  }, [pathname]);

  const computeScrollHints = useCallback(() => {
    const el = navRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScrollTop = scrollHeight - clientHeight;
    const atTopNow = scrollTop <= 0;
    const atBottomNow = scrollTop >= maxScrollTop - 1;

    setAtTop(atTopNow);
    setShowTopShadow(!atTopNow);
    setShowBottomShadow(!atBottomNow);
  }, []);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    const handle = () => computeScrollHints();
    handle();

    el.addEventListener("scroll", handle, { passive: true });
    window.addEventListener("resize", handle);

    return () => {
      el.removeEventListener("scroll", handle);
      window.removeEventListener("resize", handle);
    };
  }, [computeScrollHints, collapsed]);

  useEffect(() => {
    computeScrollHints();
  }, [pathname, expanded, computeScrollHints]);

  const displayName = useMemo(() => "SmartWebify", []);
  const initials = useMemo(() => "SW", []);

  const hasPermission = useCallback((perm?: string) => {
    void perm;
    return true;
  }, []);

  const toggleCollapse = () => setCollapsed((c) => !c);

  const toggleExpand = (name: string) =>
    setExpanded((prev) => {
      const isOpen = !!prev[name];
      return isOpen ? {} : { [name]: true };
    });

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      nav("/login", { replace: true });
      setSigningOut(false);
    }
  };

  const CollapsedRow = ({ item }: { item: SidebarItem }) => {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const active = isSectionActive(item);
    const Icon = item.icon;

    return (
      <div className="group relative flex flex-col md:gap-2">
        <div
          className={`flex h-12 gap-2 justify-center items-center transition-all duration-200 my-0.5 ${
            active ? "bg-white text-black mx-2 rounded" : "hover:bg-white hover:text-black mx-2 rounded"
          }`}
          title={item.name}
        >
          {item.to && !hasChildren ? (
            <Link
              to={item.to}
              onClick={() => closeIfMobile()}
              aria-current={isHrefActive(item.to) ? "page" : undefined}
              className="flex items-center justify-center w-full h-full"
            >
              {Icon ? <Icon size={20} /> : null}
            </Link>
          ) : (
            <div className="w-full h-full flex items-center justify-center cursor-pointer">
              {Icon ? <Icon size={20} /> : null}
            </div>
          )}
        </div>

        <span aria-hidden className="absolute left-full top-0 bottom-0 w-2 z-40" />

        {hasChildren && (
          <div className="hidden group-hover:block absolute left-full top-0 ml-2 z-50 min-w-56 max-w-72 rounded-md shadow-xl bg-(--primary) text-white overflow-hidden">
            <div className="px-3 py-2 text-xs font-semibold bg-white/10">{item.name}</div>

            <div className="py-2">
              {item.children?.map((child) => {
                if (child.isHeader) {
                  return (
                    <div key={child.name} className="mb-1">
                      <div className="px-4 py-1 text-[11px] uppercase tracking-wide text-white/80">
                        {child.name}
                      </div>
                      <ul className="px-1">
                        {child.children?.map((sub) => {
                          const activeSub = isHrefActive(sub.to);
                          return (
                            <li key={sub.name}>
                              <Link
                                to={sub.to!}
                                onClick={() => closeIfMobile()}
                                aria-current={activeSub ? "page" : undefined}
                                className={`flex items-center gap-2 px-4 py-2 text-sm rounded ${
                                  activeSub ? "bg-white text-black" : "hover:bg-white hover:text-(--hoverText)"
                                }`}
                              >
                                <span>{sub.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                }

                const activeChild = isHrefActive(child.to);
                return (
                  <Link
                    key={child.name}
                    to={child.to!}
                    onClick={() => closeIfMobile()}
                    aria-current={activeChild ? "page" : undefined}
                    className={`flex items-center gap-2 px-4 py-2 text-sm ${
                      activeChild ? "bg-white text-black" : "hover:bg-white hover:text-(--hoverText)"
                    }`}
                  >
                    <span>{child.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {collapsed && (
        <div className="md:hidden fixed py-4 px-2 flex justify-end">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Ouvrir le menu"
            title="Ouvrir le menu"
            className="p-2 rounded-md border-2 border-white/20 text-(--primary) active:scale-95 transition"
          >
            <FaBars size={30} />
          </button>
        </div>
      )}

      {!collapsed ? <div onClick={toggleCollapse} className="fixed inset-0 bg-black/30 z-40 md:hidden" /> : null}

      <aside
        className={`fixed top-0 left-0 z-50 h-dvh bg-(--primary) text-white
          transition-all duration-300 ease-in-out
          ${collapsed ? "-translate-x-full w-15" : "translate-x-0 w-[70%] md:w-70"}
          md:sticky md:top-0 md:self-start md:translate-x-0`}
      >
        <div className="flex flex-col justify-between h-screen">
          <div className="flex items-center justify-center h-20 border-b-2 z-50">
            <div className="flex items-center gap-2">
              <div className="text-xl text-white flex items-center justify-center font-semibold border-y-2">
                {initials}
              </div>

              {!collapsed && (
                <>
                  <div className="flex flex-col transition-all whitespace-nowrap duration-500 ease-in-out">
                    <span className="capitalize">{displayName}</span>
                    <span className="text-[8px] font-light">{user?.email ?? "—"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    aria-label="Fermer le menu"
                    title="Fermer le menu"
                    className="ml-4 md:hidden inline-flex h-8 w-8 items-center justify-center text-white hover:bg-white/20 active:scale-95"
                  >
                    <LuArrowBigLeft size={30} />
                  </button>
                </>
              )}
            </div>

            <IconButton
              icon={collapsed ? <LuArrowBigRight size={20} /> : <LuArrowBigLeft size={20} />}
              onClick={toggleCollapse}
              ariaLabel={collapsed ? "Ouvrir la barre latérale" : "Fermer la barre latérale"}
            />
          </div>

          {!collapsed && (
            <div
              aria-hidden
              className={`pointer-events-none absolute left-0 right-0 h-4 transition-opacity duration-200
                bg-linear-to-b from-black/50 to-transparent
                ${showTopShadow ? "opacity-100" : "opacity-0"} top-20`}
            />
          )}

          {!collapsed && showTopShadow && (
            <div className="pointer-events-none hidden md:block absolute right-3 top-21.25">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 text-[8px] uppercase tracking-wide">
                <BiChevronUp size={8} />
                <span>Top</span>
              </div>
            </div>
          )}

          <nav
            ref={navRef}
            className={`flex-1 flex-col h-[40%] py-4
              ${collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}
              [&::-webkit-scrollbar]:w-1
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-white/10
              hover:[&::-webkit-scrollbar-thumb]:bg-white/20
              active:[&::-webkit-scrollbar-thumb]:bg-white/25
              [&::-webkit-scrollbar-thumb]:rounded-full
              [scrollbar-width:thin]
              [scrollbar-color:rgba(255,255,255,0.2)_transparent]
              [&::-webkit-scrollbar-button]:hidden
              [&::-webkit-scrollbar-button:single-button]:hidden
              [&::-webkit-scrollbar-button:start:decrement]:hidden
              [&::-webkit-scrollbar-button:end:increment]:hidden`}
          >
            <div className="flex flex-col">
              {sidebarItems
                .filter((item) => !item.permission || hasPermission(item.permission))
                .map((item) => {
                  const isOpen = !!expanded[item.name];
                  const Icon = item.icon;

                  if (collapsed) return <CollapsedRow key={item.name} item={item} />;

                  return (
                    <div key={item.name}>
                      {item.children ? (
                        <>
                          <div
                            onClick={() => {
                              toggleExpand(item.name);
                              requestAnimationFrame(computeScrollHints);
                            }}
                            onTouchStart={() => {}}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleExpand(item.name);
                                requestAnimationFrame(computeScrollHints);
                              }
                            }}
                            aria-expanded={isOpen}
                            className={[
                              "flex items-center px-8 h-12 cursor-pointer text-xs select-none my-0.5 mx-2 rounded",
                              isSectionActive(item)
                                ? "bg-white text-black"
                                : "hover:bg-white hover:text-(--hoverText) active:bg-white active:text-black focus:bg-white focus:text-(--hoverText)",
                            ].join(" ")}
                          >
                            <span className="mr-3">{Icon ? <Icon size={18} /> : null}</span>
                            <span className="flex-1 whitespace-nowrap overflow-hidden">{item.name}</span>
                            <span
                              className={[
                                "transform transition-transform duration-200 ease-in-out",
                                isOpen ? "rotate-90" : "rotate-0",
                              ].join(" ")}
                            >
                              <BiChevronRight size={20} />
                            </span>
                          </div>

                          <ul
                            className={`ml-8 flex flex-col text-xs overflow-hidden transition-all duration-500 ease-in-out gap-1 ${
                              isOpen ? "max-h-fit opacity-100 py-1" : "max-h-0 opacity-0"
                            }`}
                          >
                            {item.children.map((child) => {
                              if (child.isHeader) {
                                return (
                                  <div key={child.name}>
                                    <div className="text-xs px-12 h-6 font-semibold text-white select-none flex items-center">
                                      {child.name}
                                    </div>
                                    <ul className="ml-4 flex flex-col gap-1 text-xs h-fit">
                                      {child.children?.map((subChild) => {
                                        const active = isHrefActive(subChild.to);
                                        return (
                                          <li key={subChild.name}>
                                            <Link
                                              to={subChild.to!}
                                              onClick={() => {
                                                closeIfMobile();
                                                requestAnimationFrame(computeScrollHints);
                                              }}
                                              onTouchStart={() => {}}
                                              aria-current={active ? "page" : undefined}
                                              className={[
                                                "flex items-center px-8 h-8 mx-2 rounded",
                                                active
                                                  ? "bg-white text-black"
                                                  : "hover:bg-white hover:text-(--hoverText) active:bg-white active:text-black focus:bg-white focus:text-(--hoverText)",
                                              ].join(" ")}
                                            >
                                              <span className="whitespace-nowrap overflow-hidden">{subChild.name}</span>
                                            </Link>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                );
                              }

                              const active = isHrefActive(child.to);
                              return (
                                <li key={child.name}>
                                  <Link
                                    to={child.to!}
                                    onClick={() => {
                                      closeIfMobile();
                                      requestAnimationFrame(computeScrollHints);
                                    }}
                                    onTouchStart={() => {}}
                                    aria-current={active ? "page" : undefined}
                                    className={[
                                      "flex items-center px-8 h-8 mx-2 rounded",
                                      active
                                        ? "bg-white text-black"
                                        : "hover:bg-white hover:text-(--hoverText) active:bg-white active:text-black focus:bg-white focus:text-(--hoverText)",
                                    ].join(" ")}
                                  >
                                    <span className="whitespace-nowrap overflow-hidden">{child.name}</span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      ) : (
                        <Link
                          to={item.to!}
                          onClick={() => {
                            closeIfMobile();
                            requestAnimationFrame(computeScrollHints);
                          }}
                          onTouchStart={() => {}}
                          aria-current={isHrefActive(item.to) ? "page" : undefined}
                          className={[
                            "flex items-center px-8 h-12 transform transition-transform duration-200 ease-in-out text-xs mx-2 my-0.5 rounded",
                            isHrefActive(item.to)
                              ? "bg-white text-black"
                              : "hover:bg-white hover:text-(--hoverText) active:bg-white active:text-black focus:bg-white focus:text-(--hoverText)",
                          ].join(" ")}
                        >
                          <span className="mr-3">{Icon ? <Icon size={18} /> : null}</span>
                          <span className="flex-1 whitespace-nowrap overflow-hidden">{item.name}</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
            </div>
          </nav>

          {!collapsed && atTop && showBottomShadow && (
            <div className="pointer-events-none absolute right-3 bottom-27.5 md:bottom-41.25">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/25 text-[8px] uppercase tracking-wide">
                <span>Scroll</span>
                <BiChevronDown size={8} />
              </div>
            </div>
          )}

          {!collapsed && (
            <div
              aria-hidden
              className={`pointer-events-none absolute left-0 right-0 h-4
                transition-opacity duration-200 z-10
                bg-linear-to-t from-black/50 to-transparent
                ${showBottomShadow ? "opacity-100" : "opacity-0"}
                bottom-25 md:bottom-40`}
            />
          )}

          <div className="flex justify-center md:h-40 h-25">
            <div className="flex items-start transition-all duration-300 ease-in-out cursor-pointer py-4">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                aria-busy={signingOut}
                className={`flex justify-center items-start transition-colors duration-200 ease-in-out cursor-pointer w-full ${
                  collapsed
                    ? "gap-2 h-10 p-2 rounded hover:bg-white hover:text-(--hoverText) disabled:opacity-60"
                    : "gap-2 h-10 w-fit p-2 border-y-2 border-2 rounded-md border-gray-200 hover:bg-white hover:text-(--hoverText) disabled:opacity-60"
                }`}
              >
                <VscSignOut size={20} />
                {!collapsed && (
                  <span className="ml-2 duration-200 transition-opacity whitespace-nowrap text-sm w-fit">
                    {signingOut ? "Déconnexion..." : "SE DÉCONNECTER"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
