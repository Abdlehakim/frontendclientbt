import type { IconType } from "react-icons";
import { FiGrid, FiUsers, FiFileText, FiSettings } from "react-icons/fi";

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
    name: "Clients",
    to: "/app/clients",
    icon: FiUsers,
  },
  {
    name: "Models",
    icon: FiFileText,
    children: [
      { name: "Model 1", to: "/app/models/module-1" },
      { name: "Model 2", to: "/app/models/module-2" },
    ],
  },
  {
    name: "Settings",
    to: "/app/settings",
    icon: FiSettings,
  },
];
