import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useEditEntry } from "../use-edit-entry";
import { apiClient } from "@/shared/api";
import { decryptPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { entryKeys } from "@/entities/entry";
import { projectKeys } from "@/entities/project";
import type { Entry, EntryFormValues, HabitFormValues, OnceFormValues } from "@/entities/entry";
import {
  createSuccessResponse,
  createErrorResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";

vi.mock("@/shared/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/shared/lib", () => ({
  hapticFeedback: vi.fn(),
}));

function createTestEnv(initialEntries?: Entry[]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });

  if (initialEntries) {
    queryClient.setQueryData(entryKeys.list(), initialEntries);
  }

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  return { queryClient, wrapper };
}

const updatedValues: EntryFormValues = {
  name: "Updated Aspirin",
  doseAmount: 2,
  doseUnit: "ml",
  notes: null,
  schedule: "morning",
  time: "09:00",
  frequency_type: "daily",
  interval_days: null,
  start_date: null,
  active: true,
  color: null,
  pre_remind: [],
};

const updatedMedication: Entry = {
  ...mockEntries[0],
  name: "Updated Aspirin",
  doseAmount: 2,
  doseUnit: "ml",
  time: "09:00",
};

describe("useEditEntry", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => vi.clearAllMocks());

  it("updates entry via PUT with encrypted payload", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(updatedMedication))
    );

    const { result } = renderHook(() => useEditEntry(), {
      wrapper: createTestEnv().wrapper,
    });

    await act(async () => {
      result.current.mutate({ id: 1, kind: "med", values: updatedValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [path, body] = vi.mocked(apiClient.put).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe("/entries/1");
    expect(body).toMatchObject({
      schedule: "morning",
      time: "09:00",
      frequency_type: "daily",
      interval_days: null,
      start_date: null,
      active: true,
    });
    expect(body).not.toHaveProperty("name");

    const decrypted = await decryptPayload(
      body.payload_encrypted as string,
      TEST_CRYPTO_KEY
    );
    expect(decrypted).toEqual({
      v: 1,
      name: "Updated Aspirin",
      dose_amount: 2,
      dose_unit: "ml",
      notes: null,
    });
    expect(result.current.data).toEqual(updatedMedication);
  });

  it("forwards the selected color for a medication", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto({ ...updatedMedication, color: "pink" }))
    );

    const { result } = renderHook(() => useEditEntry(), {
      wrapper: createTestEnv().wrapper,
    });

    await act(async () => {
      result.current.mutate({ id: 1, kind: "med", values: { ...updatedValues, color: "pink" } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, body] = vi.mocked(apiClient.put).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(body.color).toBe("pink");
  });

  it("replaces the entry in the cached list on success", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(updatedMedication))
    );

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useEditEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 1, kind: "med", values: updatedValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Entry[]>(entryKeys.list());
    expect(cached).toHaveLength(mockEntries.length);
    expect(cached?.[0]).toEqual(updatedMedication);
    expect(cached?.[1]).toEqual(mockEntries[1]);
  });

  it("fails without a crypto key", async () => {
    useSessionStore.setState({ cryptoKey: null, bootState: "unlock" });

    const { result } = renderHook(() => useEditEntry(), {
      wrapper: createTestEnv().wrapper,
    });

    await act(async () => {
      result.current.mutate({ id: 1, kind: "med", values: updatedValues });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("crypto_key_missing");
    expect(apiClient.put).not.toHaveBeenCalled();
  });

  it("throws when response is not successful", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(createErrorResponse("Not found"));

    const { result } = renderHook(() => useEditEntry(), {
      wrapper: createTestEnv().wrapper,
    });

    await act(async () => {
      result.current.mutate({ id: 999, kind: "med", values: updatedValues });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Not found");
  });

  it("updates a habit via PUT with days_of_week and no schedule", async () => {
    const updatedHabit: Entry = { ...mockEntries[2], name: "Stretch more", days_of_week: 21 };
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(updatedHabit))
    );

    const habitValues: HabitFormValues = {
      name: "Stretch more",
      notes: null,
      time: "07:00",
      frequency_type: "weekly",
      days_of_week: 21,
      interval_days: null,
      start_date: null,
      active: true,
      tag: null,
    };

    const { result } = renderHook(() => useEditEntry(), {
      wrapper: createTestEnv().wrapper,
    });

    await act(async () => {
      result.current.mutate({ id: 3, kind: "habit", values: habitValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [path, body] = vi.mocked(apiClient.put).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe("/entries/3");
    expect(body).toMatchObject({
      days_of_week: 21,
      frequency_type: "weekly",
    });
    expect(body).not.toHaveProperty("schedule");

    const decrypted = await decryptPayload(
      body.payload_encrypted as string,
      TEST_CRYPTO_KEY
    );
    expect(decrypted.dose_amount).toBeNull();
    expect(decrypted.dose_unit).toBeNull();
  });

  it("invalidates the projects list when a task is updated", async () => {
    const updatedTask: Entry = { ...mockEntries[0], id: 9, kind: "task" };
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(updatedTask))
    );

    const { queryClient, wrapper } = createTestEnv();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useEditEntry(), { wrapper });

    const taskValues: OnceFormValues = {
      name: "Submit report",
      notes: null,
      date_once: "2026-04-10",
      time: "18:00",
      pre_remind: [],
      project_id: null,
    };

    await act(async () => {
      result.current.mutate({ id: 9, kind: "task", values: taskValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectKeys.list() })
    );
  });

  it("does not invalidate the projects list when a medication is updated", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(updatedMedication))
    );

    const { queryClient, wrapper } = createTestEnv();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useEditEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ id: 1, kind: "med", values: updatedValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectKeys.list() })
    );
  });

  it("updates a note by sending only the encrypted payload", async () => {
    const updatedNote: Entry = { ...mockEntries[0], id: 8, kind: "note", name: "Updated note" };
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(updatedNote))
    );

    const { result } = renderHook(() => useEditEntry(), {
      wrapper: createTestEnv().wrapper,
    });

    await act(async () => {
      result.current.mutate({
        id: 8,
        kind: "note",
        values: { name: "Updated note", notes: "New body" },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [path, body] = vi.mocked(apiClient.put).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe("/entries/8");
    expect(Object.keys(body)).toEqual(["payload_encrypted"]);

    const decrypted = await decryptPayload(
      body.payload_encrypted as string,
      TEST_CRYPTO_KEY
    );
    expect(decrypted).toEqual({
      v: 1,
      name: "Updated note",
      dose_amount: null,
      dose_unit: null,
      notes: "New body",
    });
  });
});
