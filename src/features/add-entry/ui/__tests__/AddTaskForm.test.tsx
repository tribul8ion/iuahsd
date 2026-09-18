import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AddTaskForm } from "../AddTaskForm";
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
    t: (key: string) => key,
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

describe("AddTaskForm", () => {
  beforeEach(async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse(
        await buildEntryDto({ ...mockEntries[0], kind: "task", name: "Submit report" })
      )
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderForm() {
    const onClose = vi.fn();
    const utils = render(<AddTaskForm isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });
    return { ...utils, onClose };
  }

  it("ignores empty name on submit", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /once.add_task/i }));
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("submits kind=task with no pre-remind selected by default", async () => {
    const { onClose } = renderForm();
    fireEvent.change(screen.getByPlaceholderText("once.task_name_placeholder"), {
      target: { value: "Submit report" },
    });
    fireEvent.click(screen.getByRole("button", { name: /once.add_task/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({
      kind: "task",
      pre_remind: [],
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("builds pre_remind from selected chips, capped at three", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("once.task_name_placeholder"), {
      target: { value: "Submit report" },
    });

    fireEvent.click(screen.getByLabelText("pre-remind-30"));
    fireEvent.click(screen.getByLabelText("pre-remind-1440"));
    fireEvent.click(screen.getByLabelText("pre-remind-180"));

    fireEvent.click(screen.getByRole("button", { name: /once.add_task/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody().pre_remind).toEqual([30, 180, 1440]);
  });

  it("toggling a selected chip off removes it", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("once.task_name_placeholder"), {
      target: { value: "Submit report" },
    });

    fireEvent.click(screen.getByLabelText("pre-remind-30"));
    fireEvent.click(screen.getByLabelText("pre-remind-30"));

    fireEvent.click(screen.getByRole("button", { name: /once.add_task/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody().pre_remind).toEqual([]);
  });

  it("submits today's date by default and encrypts the name", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("once.task_name_placeholder"), {
      target: { value: "Submit report" },
    });
    fireEvent.click(screen.getByRole("button", { name: /once.add_task/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const body = lastPostBody();
    expect(body.date_once).toEqual(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(body).not.toHaveProperty("name");

    const decrypted = await decryptPayload(body.payload_encrypted, TEST_CRYPTO_KEY);
    expect(decrypted.name).toBe("Submit report");
    expect(decrypted.dose_amount).toBeNull();
  });
});
