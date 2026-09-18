import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import { useSessionStore } from "@/shared/session";
import { hapticFeedback } from "@/shared/lib";
import { buildExportFile, downloadExportFile } from "./build-export-file";
import type { ExportFile, ExportResponseDto } from "./types";

export function useExportData() {
  const cryptoKey = useSessionStore((s) => s.cryptoKey);

  return useMutation<ExportFile, Error, void>({
    mutationFn: async () => {
      if (cryptoKey === null) {
        throw new Error("crypto_key_missing");
      }
      const response = await apiClient.get<ExportResponseDto>("/me/export");
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to export data");
      }
      return buildExportFile(response.data, cryptoKey);
    },
    onSuccess: (file) => {
      downloadExportFile(file);
      hapticFeedback("notification", "success");
    },
    onError: () => {
      hapticFeedback("notification", "error");
    },
  });
}
