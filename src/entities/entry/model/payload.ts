import type { EntryPayloadV1 } from "@/shared/crypto";
import type {
  EntryFormValues,
  HabitFormValues,
  OnceFormValues,
  NoteFormValues,
} from "./types";

export type EntryPayloadVariables =
  | { kind: "med"; values: EntryFormValues }
  | { kind: "habit"; values: HabitFormValues }
  | { kind: "task" | "doc"; values: OnceFormValues }
  | { kind: "note"; values: NoteFormValues };

export function isOnceVariables<T extends EntryPayloadVariables>(
  variables: T
): variables is Extract<T, { kind: "task" | "doc" }> {
  return variables.kind === "task" || variables.kind === "doc";
}

export function isNoteVariables<T extends EntryPayloadVariables>(
  variables: T
): variables is Extract<T, { kind: "note" }> {
  return variables.kind === "note";
}

export function buildPayload(variables: EntryPayloadVariables): EntryPayloadV1 {
  if (variables.kind === "med") {
    return {
      v: 1,
      name: variables.values.name,
      dose_amount: variables.values.doseAmount,
      dose_unit: variables.values.doseUnit,
      notes: variables.values.notes,
    };
  }
  return {
    v: 1,
    name: variables.values.name,
    dose_amount: null,
    dose_unit: null,
    notes: variables.values.notes,
  };
}
