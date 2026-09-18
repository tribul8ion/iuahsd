import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AddMedicationForm } from "../AddMedicationForm";
import { apiClient } from "@/shared/api";
import { decryptPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
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

type PostBody = Record<string, unknown> & { payload_encrypted: string };

function lastPostBody(): PostBody {
  const [, body] = vi.mocked(apiClient.post).mock.calls[0];
  return body as PostBody;
}

describe("AddMedicationForm", () => {
  beforeEach(async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(mockEntries[0]))
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderForm() {
    const onClose = vi.fn();
    const utils = render(
      <AddMedicationForm isOpen={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );
    return { ...utils, onClose };
  }

  it("renders frequency and dosage sections", () => {
    renderForm();
    expect(screen.getByText("medications.frequency")).toBeInTheDocument();
    expect(screen.getByText("medications.frequency_daily")).toBeInTheDocument();
    expect(screen.getByText("medications.frequency_interval")).toBeInTheDocument();
    expect(screen.getByText("medications.dosage")).toBeInTheDocument();
  });

  it("does not show interval stepper when daily is selected", () => {
    renderForm();
    expect(screen.queryByLabelText("interval-value")).not.toBeInTheDocument();
  });

  it("shows stepper with default 7 when switching to interval", () => {
    renderForm();
    fireEvent.click(screen.getByText("medications.frequency_interval"));
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("7");
  });

  it("increments interval up to clamp 30", () => {
    renderForm();
    fireEvent.click(screen.getByText("medications.frequency_interval"));
    const inc = screen.getByLabelText("interval-increment");
    for (let i = 0; i < 30; i++) {
      fireEvent.click(inc);
    }
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("30");
    expect(inc).toBeDisabled();
  });

  it("decrements interval down to clamp 2", () => {
    renderForm();
    fireEvent.click(screen.getByText("medications.frequency_interval"));
    const dec = screen.getByLabelText("interval-decrement");
    for (let i = 0; i < 30; i++) {
      fireEvent.click(dec);
    }
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("2");
    expect(dec).toBeDisabled();
  });

  it("submits daily schedule with encrypted name and interval_days null", async () => {
    const { onClose } = renderForm();

    const input = screen.getByPlaceholderText("medications.medication_name_placeholder");
    fireEvent.change(input, { target: { value: "Aspirin" } });
    const submit = screen.getByRole("button", { name: /medications.add_medication/i });
    fireEvent.click(submit);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });
    const body = lastPostBody();
    expect(body).toMatchObject({
      kind: "med",
      schedule: "morning",
      frequency_type: "daily",
      interval_days: null,
      start_date: null,
      active: true,
    });
    expect(body).not.toHaveProperty("name");

    const decrypted = await decryptPayload(body.payload_encrypted, TEST_CRYPTO_KEY);
    expect(decrypted.name).toBe("Aspirin");
    expect(decrypted.dose_amount).toBeNull();
    expect(decrypted.dose_unit).toBeNull();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("submits interval payload with chosen N", async () => {
    renderForm();

    fireEvent.change(
      screen.getByPlaceholderText("medications.medication_name_placeholder"),
      { target: { value: "Shot" } }
    );
    fireEvent.click(screen.getByText("medications.frequency_interval"));
    fireEvent.click(screen.getByLabelText("interval-increment"));
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("8");

    fireEvent.click(screen.getByRole("button", { name: /medications.add_medication/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({
      frequency_type: "interval",
      interval_days: 8,
    });
  });

  it("switching back to daily clears interval_days in payload", async () => {
    renderForm();

    fireEvent.change(
      screen.getByPlaceholderText("medications.medication_name_placeholder"),
      { target: { value: "Flip" } }
    );
    fireEvent.click(screen.getByText("medications.frequency_interval"));
    fireEvent.click(screen.getByText("medications.frequency_daily"));

    fireEvent.click(screen.getByRole("button", { name: /medications.add_medication/i }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({
      frequency_type: "daily",
      interval_days: null,
    });
  });

  it("encrypts dosage amount and unit when amount entered", async () => {
    renderForm();

    fireEvent.change(
      screen.getByPlaceholderText("medications.medication_name_placeholder"),
      { target: { value: "Pill" } }
    );
    fireEvent.change(screen.getByLabelText("dosage-amount"), {
      target: { value: "1.5" },
    });

    fireEvent.click(screen.getByRole("button", { name: /medications.add_medication/i }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());

    const decrypted = await decryptPayload(
      lastPostBody().payload_encrypted,
      TEST_CRYPTO_KEY
    );
    expect(decrypted.dose_amount).toBe(1.5);
    expect(decrypted.dose_unit).toBe("tablet");
  });

  it("encrypts null dosage when amount empty", async () => {
    renderForm();

    fireEvent.change(
      screen.getByPlaceholderText("medications.medication_name_placeholder"),
      { target: { value: "NoDosage" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /medications.add_medication/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());

    const decrypted = await decryptPayload(
      lastPostBody().payload_encrypted,
      TEST_CRYPTO_KEY
    );
    expect(decrypted.dose_amount).toBeNull();
    expect(decrypted.dose_unit).toBeNull();
  });

  it("opens dosage unit modal and updates unit label on save", () => {
    renderForm();
    const unitButton = screen.getByLabelText("dosage-unit");
    expect(unitButton).toHaveTextContent("medications.dosage_unit.tablet");
    fireEvent.click(unitButton);

    const mlOptions = screen.getAllByText("medications.dosage_unit.ml");
    fireEvent.click(mlOptions[mlOptions.length - 1]);
    fireEvent.click(screen.getByRole("button", { name: /medications.dosage_unit_save/i }));

    expect(screen.getByLabelText("dosage-unit")).toHaveTextContent(
      "medications.dosage_unit.ml"
    );
  });

  it("renders the color picker with no color selected by default", () => {
    renderForm();
    expect(screen.getByLabelText("color-none")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("color-blue")).toHaveAttribute("aria-pressed", "false");
  });

  it("submits the selected color key", async () => {
    renderForm();

    fireEvent.change(
      screen.getByPlaceholderText("medications.medication_name_placeholder"),
      { target: { value: "Colored" } }
    );
    fireEvent.click(screen.getByLabelText("color-blue"));
    fireEvent.click(screen.getByRole("button", { name: /medications.add_medication/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({ color: "blue" });
  });

  it("submits null color when no swatch is selected", async () => {
    renderForm();

    fireEvent.change(
      screen.getByPlaceholderText("medications.medication_name_placeholder"),
      { target: { value: "Plain" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /medications.add_medication/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({ color: null });
  });

  it("ignores empty name on submit", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /medications.add_medication/i }));
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
