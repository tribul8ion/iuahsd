import { encryptProjectPayload } from "@/shared/crypto";
import { toProject } from "../decrypt";
import type { ProjectDto } from "../types";

const TEST_KEY: Uint8Array = new Uint8Array(32).fill(3);

async function buildDto(name: string, key: Uint8Array = TEST_KEY): Promise<ProjectDto> {
  return {
    id: 1,
    payload_encrypted: await encryptProjectPayload({ v: 1, name }, key),
    total_tasks: 4,
    done_tasks: 2,
    created_at: "2026-01-01T00:00:00Z",
  };
}

describe("toProject", () => {
  it("decrypts the project name and maps counts", async () => {
    const dto = await buildDto("Kitchen renovation");

    const project = await toProject(dto, TEST_KEY);

    expect(project).toEqual({
      id: 1,
      name: "Kitchen renovation",
      total: 4,
      done: 2,
      created_at: "2026-01-01T00:00:00Z",
      corrupted: false,
    });
  });

  it("marks the project as corrupted when decryption fails", async () => {
    const dto = await buildDto("Kitchen renovation");
    const tampered = { ...dto, payload_encrypted: "AAAA" + dto.payload_encrypted.slice(4) };

    const project = await toProject(tampered, TEST_KEY);

    expect(project.corrupted).toBe(true);
    expect(project.name).toBe("");
    expect(project.total).toBe(4);
    expect(project.done).toBe(2);
  });

  it("marks the project as corrupted when decrypted with a wrong key", async () => {
    const otherKey = new Uint8Array(32).fill(9);
    const dto = await buildDto("Kitchen renovation", otherKey);

    const project = await toProject(dto, TEST_KEY);

    expect(project.corrupted).toBe(true);
  });
});
