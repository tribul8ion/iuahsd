import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useAddEntry } from "../use-add-entry";
import { apiClient } from "@/shared/api";
import { decryptPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { entryKeys } from "@/entities/entry";
import { markKeys } from "@/entities/mark";
import { projectKeys } from "@/entities/project";
import type { Entry, EntryFormValues } from "@/entities/entry";
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

const newMedValues: EntryFormValues = {
  name: "Ibuprofen",
  doseAmount: null,
  doseUnit: null,
  notes: null,
  schedule: "day",
  time: "14:00",
  frequency_type: "daily",
  interval_days: null,
  start_date: null,
  active: true,
  color: null,
  pre_remind: [],
};

const newMedication: Entry = {
  id: 3,
  kind: "med",
  name: "Ibuprofen",
  doseAmount: null,
  doseUnit: null,
  notes: null,
  schedule: "day",
  time: "14:00",
  frequency_type: "daily",
  interval_days: null,
  days_of_week: null,
  date_once: null,
  tag: null,
  color: null,
  start_date: null,
  active: true,
  notifications_enabled: true,
  muted_today: false,
  streak_current: 0,
  streak_best: 0,
  next_run_at: null,
  last_sent_at: null,
  created_at: "2026-04-07T14:00:00Z",
  pre_remind: null,
  project_id: null,
  done: null,
  corrupted: false,
};

describe("useAddEntry", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  async function mockCreatedResponse(entry: Entry) {
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(entry))
    );
  }

  it("posts encrypted payload with schedule metadata for a medication", async () => {
    await mockCreatedResponse(newMedication);

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ kind: "med", values: newMedValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [path, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(path).toBe("/entries");
    expect(body).toMatchObject({
      kind: "med",
      schedule: "day",
      time: "14:00",
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
      name: "Ibuprofen",
      dose_amount: null,
      dose_unit: null,
      notes: null,
    });
  });

  it("forwards the selected color for a medication", async () => {
    await mockCreatedResponse({ ...newMedication, color: "blue" });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ kind: "med", values: { ...newMedValues, color: "blue" } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(body.color).toBe("blue");
  });

  it("posts habit metadata with null dosage fields", async () => {
    const newHabit: Entry = { ...mockEntries[2], id: 4, name: "Stretch" };
    await mockCreatedResponse(newHabit);

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({
        kind: "habit",
        values: {
          name: "Stretch",
          notes: null,
          time: "07:00",
          frequency_type: "weekly",
          days_of_week: 21,
          interval_days: null,
          start_date: null,
          active: true,
          tag: null,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(body).toMatchObject({
      kind: "habit",
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

  it("encrypts dosage fields into the payload", async () => {
    await mockCreatedResponse({
      ...newMedication,
      doseAmount: 1.5,
      doseUnit: "tablet",
    });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({
        kind: "med",
        values: { ...newMedValues, doseAmount: 1.5, doseUnit: "tablet" },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const decrypted = await decryptPayload(
      body.payload_encrypted as string,
      TEST_CRYPTO_KEY
    );
    expect(decrypted.dose_amount).toBe(1.5);
    expect(decrypted.dose_unit).toBe("tablet");
  });

  it("appends the decrypted entry to the cached list on success", async () => {
    await mockCreatedResponse(newMedication);

    const { queryClient, wrapper } = createTestEnv(mockEntries);
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ kind: "med", values: newMedValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<Entry[]>(entryKeys.list());
    expect(cached).toHaveLength(mockEntries.length + 1);
    expect(cached?.[mockEntries.length]).toEqual(newMedication);
  });

  it("invalidates all marks on success", async () => {
    await mockCreatedResponse(newMedication);

    const { queryClient, wrapper } = createTestEnv();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ kind: "med", values: newMedValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: markKeys.all })
    );
  });

  it("fails without a crypto key", async () => {
    useSessionStore.setState({ cryptoKey: null, bootState: "unlock" });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ kind: "med", values: newMedValues });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("crypto_key_missing");
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("throws when response is not successful", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      createErrorResponse("too_many_active_reminders")
    );

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ kind: "med", values: newMedValues });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("too_many_active_reminders");
  });

  it("forwards frequency_type interval and interval_days verbatim", async () => {
    await mockCreatedResponse({
      ...newMedication,
      frequency_type: "interval",
      interval_days: 7,
      start_date: "2026-04-07",
    });

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({
        kind: "med",
        values: {
          ...newMedValues,
          frequency_type: "interval",
          interval_days: 7,
          start_date: "2026-04-07",
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(body).toMatchObject({
      frequency_type: "interval",
      interval_days: 7,
      start_date: "2026-04-07",
    });
  });

  it("posts a note with forced none/custom/00:00 metadata", async () => {
    const newNote: Entry = {
      ...newMedication,
      id: 5,
      kind: "note",
      name: "Shopping list",
    };
    await mockCreatedResponse(newNote);

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({
        kind: "note",
        values: { name: "Shopping list", notes: "Milk, eggs" },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(body).toMatchObject({
      kind: "note",
      frequency_type: "none",
      schedule: "custom",
      time: "00:00",
      active: true,
    });
    expect(body).not.toHaveProperty("date_once");
    expect(body).not.toHaveProperty("days_of_week");
    expect(body).not.toHaveProperty("tag");
    expect(body).not.toHaveProperty("pre_remind");

    const decrypted = await decryptPayload(
      body.payload_encrypted as string,
      TEST_CRYPTO_KEY
    );
    expect(decrypted).toEqual({
      v: 1,
      name: "Shopping list",
      dose_amount: null,
      dose_unit: null,
      notes: "Milk, eggs",
    });
  });

  it("sends project_id for a task when a project is selected", async () => {
    const newTask: Entry = { ...newMedication, id: 6, kind: "task" };
    await mockCreatedResponse(newTask);

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({
        kind: "task",
        values: {
          name: "Submit report",
          notes: null,
          date_once: "2026-04-10",
          time: "18:00",
          pre_remind: [],
          project_id: 3,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(body.project_id).toBe(3);
  });

  it("invalidates the projects list when a task is added", async () => {
    const newTask: Entry = { ...newMedication, id: 6, kind: "task" };
    await mockCreatedResponse(newTask);

    const { queryClient, wrapper } = createTestEnv();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({
        kind: "task",
        values: {
          name: "Submit report",
          notes: null,
          date_once: "2026-04-10",
          time: "18:00",
          pre_remind: [],
          project_id: null,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectKeys.list() })
    );
  });

  it("does not invalidate the projects list for a medication", async () => {
    await mockCreatedResponse(newMedication);

    const { queryClient, wrapper } = createTestEnv();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({ kind: "med", values: newMedValues });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: projectKeys.list() })
    );
  });

  it("omits project_id from the request for a doc entry", async () => {
    const newDoc: Entry = { ...newMedication, id: 7, kind: "doc" };
    await mockCreatedResponse(newDoc);

    const { wrapper } = createTestEnv();
    const { result } = renderHook(() => useAddEntry(), { wrapper });

    await act(async () => {
      result.current.mutate({
        kind: "doc",
        values: {
          name: "Dentist",
          notes: null,
          date_once: "2026-04-10",
          time: "10:00",
          pre_remind: [180, 1440],
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const [, body] = vi.mocked(apiClient.post).mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(body).not.toHaveProperty("project_id");
  });
});
