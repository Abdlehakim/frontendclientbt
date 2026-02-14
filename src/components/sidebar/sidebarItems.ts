import type { IconType } from "react-icons";
import { FiGrid, FiFileText } from "react-icons/fi";
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
    name: "Calculateur",
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
