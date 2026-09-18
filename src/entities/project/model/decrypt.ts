import {
  DecryptError,
  UnsupportedVersionError,
  decryptProjectPayload,
} from "@/shared/crypto";
import type { Project, ProjectDto } from "./types";

export async function toProject(dto: ProjectDto, key: Uint8Array): Promise<Project> {
  try {
    const payload = await decryptProjectPayload(dto.payload_encrypted, key);
    return {
      id: dto.id,
      name: payload.name,
      total: dto.total_tasks,
      done: dto.done_tasks,
      created_at: dto.created_at,
      corrupted: false,
    };
  } catch (error) {
    if (
      error instanceof DecryptError ||
      error instanceof UnsupportedVersionError ||
      error instanceof SyntaxError
    ) {
      return {
        id: dto.id,
        name: "",
        total: dto.total_tasks,
        done: dto.done_tasks,
        created_at: dto.created_at,
        corrupted: true,
      };
    }
    throw error;
  }
}
