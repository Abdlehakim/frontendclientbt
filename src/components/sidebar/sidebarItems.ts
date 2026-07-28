import type { IconType } from "react-icons";
import {
  FiActivity,
  FiCalendar,
  FiFileText,
  FiFolder,
  FiGrid,
  FiUsers,
} from "react-icons/fi";
import { APP_HREFS } from "@/routes/paths";

export type SidebarItem = {
  name: string;
  to?: string;
  icon?: IconType;
  permission?: string;
  isHeader?: boolean;
  children?: SidebarItem[];
};

export const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    to: APP_HREFS.dashboard,
    icon: FiGrid,
  },

  {
    name: "Users",
    to: APP_HREFS.users,
    icon: FiUsers,
    permission: "company-owner",
  },

  {
    name: "Projets",
    to: APP_HREFS.projects,
    icon: FiFolder,
    permission: "submodule:FERRAILLAGE",
  },

  {
    name: "Planification",
    to: APP_HREFS.projectsPlanning,
    icon: FiCalendar,
    permission: "submodule:FERRAILLAGE",
  },

  {
    name: "Suivi",
    to: APP_HREFS.projectsTracking,
    icon: FiActivity,
    permission: "submodule:FERRAILLAGE",
  },

  {
    name: "Métré",
    to: APP_HREFS.module1Root,
    icon: FiFileText,
    permission: "module:MODULE_1",
    children: [
      {
        name: "Ferraillage",
        to: APP_HREFS.ferraillage,
        permission: "submodule:FERRAILLAGE",
      },
    ],
  },
];
