export type ProjectCatalogItem = {
  id: number;
  name: string;
  repoUrl: string;
};

export const projectCatalog: ProjectCatalogItem[] = [
  {
    id: 101,
    name: 'api-server',
    repoUrl: 'https://github.com/org/api-server',
  },
  {
    id: 102,
    name: 'web-app',
    repoUrl: 'https://github.com/org/web-app',
  },
  {
    id: 103,
    name: 'worker',
    repoUrl: 'https://github.com/org/worker',
  },
  {
    id: 104,
    name: 'q-demo',
    repoUrl: 'https://github.com/richer421/q-demo',
  },
];

export function findProjectCatalogItem(projectID: number) {
  return projectCatalog.find((item) => item.id === projectID);
}
