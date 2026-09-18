import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { encryptPayload } from "@/shared/crypto";
import { useSessionStore } from "@/shared/session";
import {
  entryKeys,
  toEntry,
  buildPayload,
  isOnceVariables,
  isNoteVariables,
} from "@/entities/entry";
import type {
  Entry,
  EntryDto,
  EntryFormValues,
  EntryKind,
  HabitFormValues,
  NoteFormValues,
} from "@/entities/entry";
import { markKeys } from "@/entities/mark";
import { projectKeys } from "@/entities/project";
import { hapticFeedback } from "@/shared/lib";
import type { OnceFormValues } from "@/entities/entry";

export type AddEntryVariables =
  | { kind: "med"; values: EntryFormValues }
  | { kind: "habit"; values: HabitFormValues }
  | { kind: "task" | "doc"; values: OnceFormValues }
  | { kind: "note"; values: NoteFormValues };

function buildRequestBody(
  variables: AddEntryVariables,
  payloadEncrypted: string
): Record<string, unknown> {
  if (isNoteVariables(variables)) {
    return {
      kind: "note" as EntryKind,
      payload_encrypted: payloadEncrypted,
      frequency_type: "none",
      schedule: "custom",
      time: "00:00",
      active: true,
    };
  }
  if (isOnceVariables(variables)) {
    const onceBase = {
      kind: variables.kind as EntryKind,
      payload_encrypted: payloadEncrypted,
      frequency_type: "once",
      date_once: variables.values.date_once,
      time: variables.values.time,
      pre_remind: variables.values.pre_remind,
      active: true,
    };
    if (variables.kind === "task") {
      return { ...onceBase, project_id: variables.values.project_id ?? null };
    }
    return onceBase;
  }
  const base = {
    kind: variables.kind as EntryKind,
    payload_encrypted: payloadEncrypted,
    time: variables.values.time,
    frequency_type: variables.values.frequency_type,
    interval_days: variables.values.interval_days,
    start_date: variables.values.start_date,
    active: variables.values.active,
  };
  if (variables.kind === "med") {
    return {
      ...base,
      schedule: variables.values.schedule,
      color: variables.values.color,
      pre_remind: variables.values.pre_remind,
    };
  }
  return { ...base, days_of_week: variables.values.days_of_week, tag: variables.values.tag };
}

export function useAddEntry() {
  const queryClient = useQueryClient();
  const cryptoKey = useSessionStore((s) => s.cryptoKey);

  return useMutation<Entry, Error, AddEntryVariables>({
    mutationFn: async (variables) => {
      if (cryptoKey === null) {
        throw new Error("crypto_key_missing");
      }
      const payload = buildPayload(variables);
      const payloadEncrypted = await encryptPayload(payload, cryptoKey);
      const response = await apiClient.post<EntryDto>(
        "/entries",
        buildRequestBody(variables, payloadEncrypted)
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to add entry");
      }
      return toEntry(response.data, cryptoKey);
    },
    onSuccess: (newEntry, variables) => {
      queryClient.setQueryData<Entry[]>(
        entryKeys.list(),
        (old) => (old ? [...old, newEntry] : [newEntry])
      );
      queryClient.invalidateQueries({ queryKey: markKeys.all });
      if (variables.kind === "task") {
        queryClient.invalidateQueries({ queryKey: projectKeys.list() });
      }
      hapticFeedback("notification", "success");
    },
    onError: () => {
      hapticFeedback("notification", "error");
    },
  });
}
