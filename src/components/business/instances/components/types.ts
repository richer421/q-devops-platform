import type {
  CreateInstanceFromTemplatePayload,
  InstanceTemplate,
} from '@/utils/api/metahub/instance-oam';
import type { Instance } from '@/mock';

export type BusinessInstancesPanelProps = {
  instances: ReadonlyArray<Instance>;
  total?: number;
  page?: number;
  pageSize?: number;
  keyword?: string;
  envFilter?: string;
  loading?: boolean;
  templates?: ReadonlyArray<InstanceTemplate>;
  onPageChange?: (page: number, pageSize: number) => void;
  onKeywordChange?: (value: string) => void;
  onEnvFilterChange?: (value: string) => void;
  onCreateInstance?: (
    payload: CreateInstanceFromTemplatePayload,
  ) => Promise<Instance | void> | Instance | void;
  onSaveInstance?: (instance: Instance) => Promise<Instance | void> | Instance | void;
  onDeleteInstance?: (instance: Instance) => Promise<void> | void;
};

export type DetailTab = 'pods' | 'config';
export type ConfigView = 'visual' | 'yaml';

export type InstanceDraft = {
  id: string;
  buId: string;
  name: string;
  env: string;
  type: string;
  instanceType: 'deployment' | 'statefulset' | 'job' | 'cronjob' | 'pod';
  replicas: number;
  readyReplicas: number;
  cpu: string;
  memory: string;
  cpuLimit: string;
  memoryLimit: string;
  startupCommand: string;
  networkMode: 'k8s-service' | 'apisix';
  status: Instance['status'];
  containerName: string;
  image: string;
  ports: number[];
  envVars: Array<{ name: string; value: string }>;
  configMaps: string[];
  secrets: string[];
  services: string[];
  yaml: string;
};

export type PodDialogKind = 'events' | 'logs' | 'terminal' | 'yaml';

export type CreateInstanceFormValues = {
  name: string;
  env: string;
  template: string;
};

export type PodDialogState = {
  kind: PodDialogKind;
  title: string;
  content: string;
} | null;
