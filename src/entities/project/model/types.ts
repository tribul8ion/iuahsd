export interface ProjectDto {
  id: number;
  payload_encrypted: string;
  total_tasks: number;
  done_tasks: number;
  created_at: string | null;
}

export interface Project {
  id: number;
  name: string;
  total: number;
  done: number;
  created_at: string | null;
  corrupted: boolean;
}
