import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { NoteModal, NOTE_BYTES_HARD_LIMIT, NOTE_BYTES_WARN_LIMIT } from "../NoteModal";
import { apiClient } from "@/shared/api";
import { decryptPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import {
  createSuccessResponse,
  createErrorResponse,
  buildEntryDto,
  mockEntries,
  TEST_CRYPTO_KEY,
} from "@/test/mocks/handlers";
import type { Entry } from "@/entities/entry";

const CYRILLIC_CHAR = "б";

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
    t: (key: string, vars?: Record<string, unknown>) => {
      if (vars && "count" in vars && "max" in vars) return `${vars.count}/${vars.max}`;
      return key;
    },
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

type PostBody = Record<string, unknown> & { payload_encrypted: string };

const existingNote: Entry = {
  ...mockEntries[0],
  id: 30,
  kind: "note",
  name: "Grocery list",
  notes: "Milk",
};

describe("NoteModal", () => {
  beforeEach(() => {
    useSessionStore.setState({ cryptoKey: TEST_CRYPTO_KEY, bootState: "ready" });
  });

  afterEach(() => vi.clearAllMocks());

  it("creates a note via useAddEntry when no note prop is given", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(
      createSuccessResponse(await buildEntryDto({ ...existingNote, id: 31 }))
    );
    const onClose = vi.fn();

    render(<NoteModal isOpen onClose={onClose} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByPlaceholderText("note.title_placeholder"), {
      target: { value: "New note" },
    });
    fireEvent.change(screen.getByPlaceholderText("note.text_placeholder"), {
      target: { value: "Some body text" },
    });
    fireEvent.click(screen.getByRole("button", { name: "note.add_title" }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    const [path, body] = vi.mocked(apiClient.post).mock.calls[0] as [string, PostBody];
    expect(path).toBe("/entries");
    expect(body).toMatchObject({ kind: "note", frequency_type: "none" });

    const decrypted = await decryptPayload(body.payload_encrypted, TEST_CRYPTO_KEY);
    expect(decrypted.name).toBe("New note");
    expect(decrypted.notes).toBe("Some body text");

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("prefills the title and text when editing an existing note", () => {
    render(<NoteModal isOpen onClose={vi.fn()} note={existingNote} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByDisplayValue("Grocery list")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Milk")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "note.delete_note" })).toBeInTheDocument();
  });

  it("saves edits via useEditEntry sending only the encrypted payload", async () => {
    vi.mocked(apiClient.put).mockResolvedValue(
      createSuccessResponse(await buildEntryDto({ ...existingNote, name: "Updated" }))
    );
    const onClose = vi.fn();

    render(<NoteModal isOpen onClose={onClose} note={existingNote} />, {
      wrapper: createWrapper(),
    });

    fireEvent.change(screen.getByDisplayValue("Grocery list"), {
      target: { value: "Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "note.save_changes" }));

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith("/entries/30", expect.any(Object)));
    const [, body] = vi.mocked(apiClient.put).mock.calls[0] as [string, PostBody];
    expect(Object.keys(body)).toEqual(["payload_encrypted"]);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("deletes the note after confirming", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ success: true, data: null, error: null });
    const onClose = vi.fn();

    render(<NoteModal isOpen onClose={onClose} note={existingNote} />, {
      wrapper: createWrapper(),
    });

    fireEvent.click(screen.getByRole("button", { name: "note.delete_note" }));
    fireEvent.click(screen.getByRole("button", { name: "common.confirm" }));

    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith("/entries/30"));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows a length warning once the byte count reaches the warn threshold", () => {
    render(<NoteModal isOpen onClose={vi.fn()} />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText("note.text_placeholder");
    const longText = "a".repeat(NOTE_BYTES_WARN_LIMIT);

    fireEvent.change(textarea, { target: { value: longText } });

    expect(screen.getByText("note.length_warning")).toBeInTheDocument();
  });

  it("does not show the warning below the warn threshold", () => {
    render(<NoteModal isOpen onClose={vi.fn()} />, { wrapper: createWrapper() });

    const textarea = screen.getByPlaceholderText("note.text_placeholder");
    fireEvent.change(textarea, { target: { value: "a".repeat(NOTE_BYTES_WARN_LIMIT - 1) } });

    expect(screen.queryByText("note.length_warning")).not.toBeInTheDocument();
  });

  it("disables submit while the title is empty", () => {
    render(<NoteModal isOpen onClose={vi.fn()} />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: "note.add_title" })).toBeDisabled();
  });

  it("allows a long cyrillic note that stays within the UTF-8 byte budget", () => {
    render(<NoteModal isOpen onClose={vi.fn()} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByPlaceholderText("note.title_placeholder"), {
      target: { value: "Заголовок" },
    });
    const textarea = screen.getByPlaceholderText("note.text_placeholder");
    const charsWithinBudget = Math.floor((NOTE_BYTES_HARD_LIMIT - 200) / 2);
    fireEvent.change(textarea, { target: { value: CYRILLIC_CHAR.repeat(charsWithinBudget) } });

    expect(screen.getByRole("button", { name: "note.add_title" })).not.toBeDisabled();
  });

  it("blocks a cyrillic note whose UTF-8 byte size exceeds the hard limit", () => {
    render(<NoteModal isOpen onClose={vi.fn()} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByPlaceholderText("note.title_placeholder"), {
      target: { value: "Заголовок" },
    });
    const textarea = screen.getByPlaceholderText("note.text_placeholder");
    const charsOverBudget = Math.ceil(NOTE_BYTES_HARD_LIMIT / 2) + 100;
    fireEvent.change(textarea, { target: { value: CYRILLIC_CHAR.repeat(charsOverBudget) } });

    expect(screen.getByRole("button", { name: "note.add_title" })).toBeDisabled();
  });

  it("shows a human-readable error when the server rejects an oversized payload", async () => {
    vi.mocked(apiClient.post).mockResolvedValue(createErrorResponse("payload_too_large"));
    const onClose = vi.fn();

    render(<NoteModal isOpen onClose={onClose} />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByPlaceholderText("note.title_placeholder"), {
      target: { value: "New note" },
    });
    fireEvent.change(screen.getByPlaceholderText("note.text_placeholder"), {
      target: { value: "Some body text" },
    });
    fireEvent.click(screen.getByRole("button", { name: "note.add_title" }));

    await waitFor(() => expect(screen.getByText("note.too_long")).toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();
  });
});
