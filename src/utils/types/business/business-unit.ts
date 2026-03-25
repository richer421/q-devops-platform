export type BusinessFormValue = {
  name: string;
  desc: string;
  projectId: number;
};

export type BusinessTableRow = {
  id: string;
  name: string;
  desc: string;
  repoUrl: string;
  projectName: string;
  projectId: number;
  status: 'active' | 'inactive';
};
