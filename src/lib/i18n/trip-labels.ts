export const TRIP_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  ARCHIVED: "Arşivlendi",
  DRAFT: "Taslak",
};

export function formatTripStatus(status: string): string {
  return TRIP_STATUS_LABELS[status] ?? status;
}
