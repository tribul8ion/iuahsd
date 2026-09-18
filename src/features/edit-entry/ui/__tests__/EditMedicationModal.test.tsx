import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { EditMedicationModal } from "../EditMedicationModal";
import { apiClient } from "@/shared/api";
import { decryptPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import type { Entry } from "@/entities/entry";
import { todayISO } from "@/shared/lib";
import {
  createSuccessResponse,
  buildEntryDto,
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

vi.mock("@/shared/lib", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib")>(
    "@/shared/lib"
  );
  return { ...actual, hapticFeedback: vi.fn() };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && "n" in vars) return `${key}:${vars.n}`;
      return key;
    },
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const dailyMedication: Entry = {
  id: 42,
  kind: "med",
  name: "Aspirin",
  doseAmount: null,
  doseUnit: null,
  notes: null,
  schedule: "morning",
  time: "08:30",
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
  created_at: "2026-05-11T00:00:00Z",
  pre_remind: null,
  project_id: null,
  done: null,
  corrupted: false,
};

const intervalMedication: Entry = {
  ...dailyMedication,
  id: 43,
  name: "Shot",
  schedule: "evening",
  time: "20:00",
  frequency_type: "interval",
  interval_days: 5,
  start_date: "2026-05-11",
  doseAmount: 1.5,
  doseUnit: "ml",
};

type PutBody = Record<string, unknown> & { payload_encrypted: string };

function lastPutCall(): [string, PutBody] {
  const [path, body] = vi.mocked(apiClient.put).mock.calls[0];
  return [path, body as PutBody];
}

describe("EditMedicationModal", () => {
  beforeEach(async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(dailyMedication))
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderModal(medication: Entry = dailyMedication) {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const utils = render(
      <EditMedicationModal
        medication={medication}
        isOpen={true}
        onClose={onClose}
        onDelete={onDelete}
      />,
      { wrapper: createWrapper() }
    );
    return { ...utils, onClose, onDelete };
  }

  it("seeds saved values for a daily medication", () => {
    renderModal();
    const nameInput = screen.getByDisplayValue("Aspirin");
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "medications.frequency_daily" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.queryByLabelText("interval-value")).not.toBeInTheDocument();
  });

  it("seeds saved values for an interval medication", () => {
    renderModal(intervalMedication);
    expect(screen.getByDisplayValue("Shot")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "medications.frequency_interval" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("5");
    expect(screen.getByLabelText("start-date")).toHaveValue("2026-05-11");
    expect(screen.getByLabelText("dosage-amount")).toHaveValue("1.5");
    expect(screen.getByLabelText("dosage-unit")).toHaveTextContent("medications.dosage_unit.ml");
  });

  it("switches daily medication to interval, showing date picker and stepper with today's date", () => {
    renderModal();
    expect(screen.queryByLabelText("start-date")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("medications.frequency_interval"));

    expect(screen.getByLabelText("interval-value")).toHaveTextContent("7");
    expect(screen.getByLabelText("start-date")).toHaveValue(todayISO());
  });

  it("hides interval panel when switching back to daily", () => {
    renderModal(intervalMedication);
    expect(screen.getByLabelText("interval-value")).toBeInTheDocument();

    fireEvent.click(screen.getByText("medications.frequency_daily"));

    expect(screen.queryByLabelText("interval-value")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("start-date")).not.toBeInTheDocument();
  });

  it("preserves today's date across interval -> daily -> interval toggling", () => {
    renderModal();
    fireEvent.click(screen.getByText("medications.frequency_interval"));
    expect(screen.getByLabelText("start-date")).toHaveValue(todayISO());

    fireEvent.click(screen.getByText("medications.frequency_daily"));
    fireEvent.click(screen.getByText("medications.frequency_interval"));

    expect(screen.getByLabelText("start-date")).toHaveValue(todayISO());
  });

  it("submits interval -> daily with start_date null and interval_days null", async () => {
    const { onClose } = renderModal(intervalMedication);

    fireEvent.click(screen.getByText("medications.frequency_daily"));
    fireEvent.click(screen.getByRole("button", { name: /medications.save_changes/i }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled());
    const [path, payload] = lastPutCall();
    expect(path).toBe("/entries/43");
    expect(payload).toMatchObject({
      frequency_type: "daily",
      interval_days: null,
      start_date: null,
      active: true,
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("submits interval payload with chosen N and start_date", async () => {
    renderModal();

    fireEvent.click(screen.getByText("medications.frequency_interval"));
    fireEvent.click(screen.getByLabelText("interval-increment"));
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("8");

    fireEvent.click(screen.getByRole("button", { name: /medications.save_changes/i }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled());
    const [, payload] = lastPutCall();
    expect(payload).toMatchObject({
      frequency_type: "interval",
      interval_days: 8,
      start_date: todayISO(),
    });
  });

  it("calls onDelete callback when delete button is clicked", () => {
    const { onDelete } = renderModal();
    fireEvent.click(screen.getByRole("button", { name: /medications.delete_medication/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("ignores empty name on submit", () => {
    renderModal();
    fireEvent.change(screen.getByDisplayValue("Aspirin"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /medications.save_changes/i }));
    expect(apiClient.put).not.toHaveBeenCalled();
  });

  it("preselects the medication's saved color", () => {
    renderModal({ ...dailyMedication, color: "lime" });
    expect(screen.getByLabelText("color-lime")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("color-none")).toHaveAttribute("aria-pressed", "false");
  });

  it("submits a changed color", async () => {
    renderModal();

    fireEvent.click(screen.getByLabelText("color-red"));
    fireEvent.click(screen.getByRole("button", { name: /medications.save_changes/i }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled());
    const [, payload] = lastPutCall();
    expect(payload).toMatchObject({ color: "red" });
  });

  it("submits null color after resetting to none", async () => {
    renderModal({ ...dailyMedication, color: "lime" });

    fireEvent.click(screen.getByLabelText("color-none"));
    fireEvent.click(screen.getByRole("button", { name: /medications.save_changes/i }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled());
    const [, payload] = lastPutCall();
    expect(payload).toMatchObject({ color: null });
  });

  it("submits updated name inside the encrypted payload", async () => {
    renderModal();

    fireEvent.change(screen.getByDisplayValue("Aspirin"), {
      target: { value: "Aspirin Plus" },
    });
    fireEvent.click(screen.getByRole("button", { name: /medications.save_changes/i }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalled());
    const [, payload] = lastPutCall();
    expect(payload).not.toHaveProperty("name");

    const decrypted = await decryptPayload(payload.payload_encrypted, TEST_CRYPTO_KEY);
    expect(decrypted.name).toBe("Aspirin Plus");
  });
});
