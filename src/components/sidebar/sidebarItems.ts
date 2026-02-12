import type { IconType } from "react-icons";
import { FiGrid, FiSettings, FiFileText } from "react-icons/fi";

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
    to: "/app",
    icon: FiGrid,
  },

  {
    name: "Calculateur",
    to: "/app/models/module-1",
    icon: FiFileText,
    permission: "module:MODULE_1",
    children: [
      { name: "Ferraillage", to: "/app/models/module-1/ferraillage", permission: "submodule:FERRAILLAGE" },
    ],
  },

  {
    name: "Module 2",
    to: "/app/models/module-2",
    icon: FiFileText,
    permission: "module:MODULE_2",
  },

  {
    name: "Settings",
    to: "/app/settings",
    icon: FiSettings,
  },
];
