// src/routes/paths.ts
export const APP_PATHS = {
  root: "/app",

  dashboard: "dashboard",
  module1Root: "models/module-1",
  ferraillage: "models/module-1/ferraillage",

  ferraillageRapports: "models/module-1/ferraillage/rapports",
} as const;

export const APP_HREFS = {
  appRoot: APP_PATHS.root,
  dashboard: `${APP_PATHS.root}/${APP_PATHS.dashboard}`,
  module1Root: `${APP_PATHS.root}/${APP_PATHS.module1Root}`,
  ferraillage: `${APP_PATHS.root}/${APP_PATHS.ferraillage}`,
  ferraillageRapports: `${APP_PATHS.root}/${APP_PATHS.ferraillageRapports}`,

  ferraillageRapportView: (rapportId: string) => `${APP_PATHS.root}/${APP_PATHS.ferraillageRapports}/${rapportId}`,
  ferraillageRapportEdit: (rapportId: string) =>
    `${APP_PATHS.root}/${APP_PATHS.ferraillageRapports}/${rapportId}/edit`,
  ferraillageRapportCreate: `${APP_PATHS.root}/${APP_PATHS.ferraillageRapports}/create`,
} as const;
