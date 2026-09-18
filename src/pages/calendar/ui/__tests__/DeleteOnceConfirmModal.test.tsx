import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { DeleteOnceConfirmModal } from "../DeleteOnceConfirmModal";
import { apiClient } from "@/shared/api";
import type { Entry } from "@/entities/entry";
import { mockEntries, createSuccessResponse } from "@/test/mocks/handlers";

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

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars && "name" in vars ? `${key}:${vars.name}` : key,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const taskEntry: Entry = { ...mockEntries[0], id: 4, kind: "task", name: "Submit report" };

describe("DeleteOnceConfirmModal", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows the entry name in the confirmation title", () => {
    render(
      <DeleteOnceConfirmModal entry={taskEntry} isOpen={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText("once.confirm_delete:Submit report")).toBeInTheDocument();
  });

  it("deletes the entry and closes on confirm", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(createSuccessResponse(undefined));
    const onClose = vi.fn();
    render(
      <DeleteOnceConfirmModal entry={taskEntry} isOpen={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByText("common.confirm"));

    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith("/entries/4"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("closes without deleting on cancel", () => {
    const onClose = vi.fn();
    render(
      <DeleteOnceConfirmModal entry={taskEntry} isOpen={true} onClose={onClose} />,
      { wrapper: createWrapper() }
    );
    fireEvent.click(screen.getByText("common.cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(apiClient.delete).not.toHaveBeenCalled();
  });
});
