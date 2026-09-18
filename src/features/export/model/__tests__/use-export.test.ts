import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useExportData } from "../use-export";
import { apiClient } from "@/shared/api";
import { encryptPayload } from "@/shared/crypto";
import type { EntryPayloadV1 } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import { hapticFeedback } from "@/shared/lib";
import { createSuccessResponse, createErrorResponse, TEST_CRYPTO_KEY } from "@/test/mocks/handlers";
import type { ExportResponseDto } from "../types";

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

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

async function buildExportResponse(): Promise<ExportResponseDto> {
  const payload: EntryPayloadV1 = {
    v: 1,
    name: "Aspirin",
    dose_amount: 1,
    dose_unit: "tablet",
    notes: null,
  };
  const payload_encrypted = await encryptPayload(payload, TEST_CRYPTO_KEY);
  return {
    telegram_id: 1,
    language: "en",
    created_at: "2026-01-01T00:00:00Z",
    exported_at: "2026-07-04T12:00:00Z",
    medications: [
      {
        id: 1,
        payload_encrypted,
        schedule: "morning",
        time: "08:00",
        frequency_type: "daily",
        interval_days: null,
        start_date: null,
        active: true,
        next_run_at: null,
        last_sent_at: null,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 2,
        payload_encrypted: "AAAA" + payload_encrypted.slice(4),
        schedule: "evening",
        time: "20:00",
        frequency_type: "daily",
        interval_days: null,
        start_date: null,
        active: true,
        next_run_at: null,
        last_sent_at: null,
        created_at: "2026-01-02T00:00:00Z",
      },
    ],
    settings: { reminders_enabled: true, reminder_repeat_minutes: 15, timezone: "UTC" },
    consents: [
      {
        policy_version: "1.0",
        consent_type: "privacy_policy",
        accepted: true,
        accepted_at: "2026-01-01T00:00:00Z",
        source: "miniapp",
      },
    ],
  };
}

describe("useExportData", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("builds a readable export file with decrypted medications and marks tampered ones as corrupted", async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    const data = await buildExportResponse();
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse(data));

    const { result } = renderHook(() => useExportData(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith("/me/export");
    const file = result.current.data!;
    expect(file.exported_at).toBe(data.exported_at);
    expect(file.settings).toEqual(data.settings);
    expect(file.consents).toEqual(data.consents);
    expect(file.medications).toHaveLength(2);
    expect(file.medications[0]).toMatchObject({
      id: 1,
      name: "Aspirin",
      dose_amount: 1,
      dose_unit: "tablet",
      schedule: "morning",
      corrupted: false,
    });
    expect(file.medications[1]).toMatchObject({ id: 2, name: "", corrupted: true });
    expect(hapticFeedback).toHaveBeenCalledWith("notification", "success");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("marks a null payload as corrupted without throwing", async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    const data = await buildExportResponse();
    data.medications = [{ ...data.medications[0], payload_encrypted: null }];
    vi.mocked(apiClient.get).mockResolvedValue(createSuccessResponse(data));

    const { result } = renderHook(() => useExportData(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.medications[0].corrupted).toBe(true);
  });

  it("fails without hitting the network when there is no crypto key", async () => {
    useSessionStore.setState({ cryptoKey: null, bootState: "boot" });

    const { result } = renderHook(() => useExportData(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(apiClient.get).not.toHaveBeenCalled();
    expect(hapticFeedback).toHaveBeenCalledWith("notification", "error");
  });

  it("propagates a server error and triggers error haptic", async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    vi.mocked(apiClient.get).mockResolvedValue(createErrorResponse("Server error"));

    const { result } = renderHook(() => useExportData(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("Server error");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
