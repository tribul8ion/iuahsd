import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { AddDocForm } from "../AddDocForm";
import { apiClient } from "@/shared/api";
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

describe("AddDocForm", () => {
  beforeEach(async () => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse(
        await buildEntryDto({ ...mockEntries[0], kind: "doc", name: "Dentist" })
      )
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderForm() {
    const onClose = vi.fn();
    const utils = render(<AddDocForm isOpen={true} onClose={onClose} />, {
      wrapper: createWrapper(),
    });
    return { ...utils, onClose };
  }

  it("ignores empty name on submit", () => {
    renderForm();
    fireEvent.click(screen.getByRole("button", { name: /once.add_doc/i }));
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("defaults pre_remind to a day before and 3 hours before", async () => {
    const { onClose } = renderForm();
    fireEvent.change(screen.getByPlaceholderText("once.doc_name_placeholder"), {
      target: { value: "Dentist" },
    });
    fireEvent.click(screen.getByRole("button", { name: /once.add_doc/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody()).toMatchObject({
      kind: "doc",
      pre_remind: [180, 1440],
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows the default pre-remind chips as pressed", () => {
    renderForm();
    expect(screen.getByLabelText("pre-remind-1440")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("pre-remind-180")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("pre-remind-30")).toHaveAttribute("aria-pressed", "false");
  });

  it("allows deselecting a default chip", async () => {
    renderForm();
    fireEvent.change(screen.getByPlaceholderText("once.doc_name_placeholder"), {
      target: { value: "Dentist" },
    });
    fireEvent.click(screen.getByLabelText("pre-remind-180"));
    fireEvent.click(screen.getByRole("button", { name: /once.add_doc/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    expect(lastPostBody().pre_remind).toEqual([1440]);
  });
});
