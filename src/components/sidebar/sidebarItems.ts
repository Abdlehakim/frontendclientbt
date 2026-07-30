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
    name: "Tableau de bord",
    to: APP_HREFS.dashboard,
    icon: FiGrid,
  },

  {
    name: "Utilisateurs",
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
    icon: FiCalendar,
    permission: "submodule:FERRAILLAGE",
    children: [
      {
        name: "Calendrier",
        to: APP_HREFS.projectsPlanningCalendar,
        permission: "submodule:FERRAILLAGE",
      },
      {
        name: "Tâches",
        to: APP_HREFS.projectsPlanningTasks,
        permission: "submodule:FERRAILLAGE",
      },
    ],
  },

  {
    name: "Suivi",
    icon: FiActivity,
    permission: "submodule:FERRAILLAGE",
    children: [
      {
        name: "Essai à la compression",
        to: APP_HREFS.projectsTracking,
        permission: "submodule:FERRAILLAGE",
      },
    ],
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
