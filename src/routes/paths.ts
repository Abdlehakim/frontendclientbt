// src/routes/paths.ts
export const APP_PATHS = {
  root: "/app",

  dashboard: "dashboard",
  users: "users",
  projects: "projects",
  projectsList: "projects/liste",
  projectsPlanning: "projects/planification",
  projectsTracking: "projects/suivi",
  module1Root: "models/module-1",
  ferraillage: "models/module-1/ferraillage",

  ferraillageRapports: "models/module-1/ferraillage/rapports",
} as const;

export const APP_HREFS = {
  appRoot: APP_PATHS.root,
  dashboard: `${APP_PATHS.root}/${APP_PATHS.dashboard}`,
  users: `${APP_PATHS.root}/${APP_PATHS.users}`,
  projects: `${APP_PATHS.root}/${APP_PATHS.projects}`,
  projectsList: `${APP_PATHS.root}/${APP_PATHS.projectsList}`,
  projectsPlanning: `${APP_PATHS.root}/${APP_PATHS.projectsPlanning}`,
  projectsTracking: `${APP_PATHS.root}/${APP_PATHS.projectsTracking}`,
  module1Root: `${APP_PATHS.root}/${APP_PATHS.module1Root}`,
  ferraillage: `${APP_PATHS.root}/${APP_PATHS.ferraillage}`,
  ferraillageRapports: `${APP_PATHS.root}/${APP_PATHS.ferraillageRapports}`,

  ferraillageRapportView: (rapportId: string) => `${APP_PATHS.root}/${APP_PATHS.ferraillageRapports}/${rapportId}`,
  ferraillageRapportEdit: (rapportId: string) =>
    `${APP_PATHS.root}/${APP_PATHS.ferraillageRapports}/${rapportId}/edit`,
  ferraillageRapportCreate: `${APP_PATHS.root}/${APP_PATHS.ferraillageRapports}/create`,
} as const;
