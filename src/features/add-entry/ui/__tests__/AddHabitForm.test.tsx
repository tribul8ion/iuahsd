import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AddHabitForm } from "../AddHabitForm";
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
      if (vars && typeof vars === "object" && "returnObjects" in vars) {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      }
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

describe("AddHabitForm", () => {
  beforeEach(async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse(await buildEntryDto(mockEntries[2]))
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderForm() {
    const onClose = vi.fn();
    const utils = render(<AddHabitForm isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });
    return { ...utils, onClose };
  }

  it("ignores empty name on submit", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("submits daily frequency with null days_of_week and interval_days", async () => {
    const { onClose } = renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Stretch" },
    });
    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({
      kind: "habit",
      frequency_type: "daily",
      days_of_week: null,
      interval_days: null,
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("blocks submit for weekly frequency with no day selected", () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Stretch" },
    });
    fireEvent.click(screen.getByText("habit.frequency_weekly"));

    const submit = screen.getByRole("button", { name: /habit.add_habit/i });
    expect(submit).toBeDisabled();
    expect(screen.getByText("habit.validation_days")).toBeInTheDocument();
  });

  it("builds the correct bitmask from selected weekday chips", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Gym" },
    });
    fireEvent.click(screen.getByText("habit.frequency_weekly"));

    fireEvent.click(screen.getByLabelText("day-0"));
    fireEvent.click(screen.getByLabelText("day-2"));
    fireEvent.click(screen.getByLabelText("day-4"));

    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({
      kind: "habit",
      frequency_type: "weekly",
      days_of_week: 21,
    });
  });

  it("toggling a selected day off removes it from the mask", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Gym" },
    });
    fireEvent.click(screen.getByText("habit.frequency_weekly"));

    fireEvent.click(screen.getByLabelText("day-0"));
    fireEvent.click(screen.getByLabelText("day-1"));
    fireEvent.click(screen.getByLabelText("day-0"));

    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({ days_of_week: 2 });
  });

  it("submits interval frequency with clamped interval_days and today's start_date", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Water plants" },
    });
    fireEvent.click(screen.getByText("habit.frequency_interval"));
    fireEvent.click(screen.getByLabelText("interval-increment"));
    expect(screen.getByLabelText("interval-value")).toHaveTextContent("8");

    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({
      frequency_type: "interval",
      interval_days: 8,
      days_of_week: null,
    });
    expect(lastPostBody().start_date).not.toBeNull();
  });

  it("encrypts habit name and null dosage fields into the payload", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Journal" },
    });
    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const decrypted = await decryptPayload(lastPostBody().payload_encrypted, TEST_CRYPTO_KEY);
    expect(decrypted.name).toBe("Journal");
    expect(decrypted.dose_amount).toBeNull();
    expect(decrypted.dose_unit).toBeNull();
  });

  it("submits with tag null by default", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Journal" },
    });
    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({ tag: null });
  });

  it("submits the selected tag key when a chip is picked", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Coffee break" },
    });
    fireEvent.click(screen.getByLabelText("tag-coffee"));
    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({ tag: "coffee" });
  });

  it("resets the tag to null when the no-tag chip is picked after selecting one", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("habit.name_placeholder"), {
      target: { value: "Coffee break" },
    });
    fireEvent.click(screen.getByLabelText("tag-coffee"));
    fireEvent.click(screen.getByLabelText("tag-none"));
    fireEvent.click(screen.getByRole("button", { name: /habit.add_habit/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({ tag: null });
  });
});
