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
  HabitFormValues,
  NoteFormValues,
  OnceFormValues,
} from "@/entities/entry";
import { markKeys } from "@/entities/mark";
import { projectKeys } from "@/entities/project";
import { hapticFeedback } from "@/shared/lib";

export type EditEntryVariables =
  | { id: number; kind: "med"; values: EntryFormValues }
  | { id: number; kind: "habit"; values: HabitFormValues }
  | { id: number; kind: "task" | "doc"; values: OnceFormValues }
  | { id: number; kind: "note"; values: NoteFormValues };

function buildRequestBody(
  variables: EditEntryVariables,
  payloadEncrypted: string
): Record<string, unknown> {
  if (isNoteVariables(variables)) {
    return {
      payload_encrypted: payloadEncrypted,
    };
  }
  if (isOnceVariables(variables)) {
    return {
      payload_encrypted: payloadEncrypted,
      date_once: variables.values.date_once,
      time: variables.values.time,
      pre_remind: variables.values.pre_remind,
    };
  }
  const base = {
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

export function useEditEntry() {
  const queryClient = useQueryClient();
  const cryptoKey = useSessionStore((s) => s.cryptoKey);

  return useMutation<Entry, Error, EditEntryVariables>({
    mutationFn: async (variables) => {
      if (cryptoKey === null) {
        throw new Error("crypto_key_missing");
      }
      const payload = buildPayload(variables);
      const payloadEncrypted = await encryptPayload(payload, cryptoKey);
      const response = await apiClient.put<EntryDto>(
        `/entries/${variables.id}`,
        buildRequestBody(variables, payloadEncrypted)
      );
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to update entry");
      }
      return toEntry(response.data, cryptoKey);
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<Entry[]>(entryKeys.list(), (old) =>
        old ? old.map((e) => (e.id === updated.id ? updated : e)) : [updated]
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
