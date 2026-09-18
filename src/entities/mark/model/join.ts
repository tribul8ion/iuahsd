export interface EntryNameSource {
  id: number;
  name: string;
  corrupted: boolean;
}

export function resolveEntryName(
  entryId: number,
  entries: readonly EntryNameSource[] | undefined
): string | null {
  const entry = entries?.find((e) => e.id === entryId);
  if (!entry || entry.corrupted) {
    return null;
  }
  return entry.name;
}
