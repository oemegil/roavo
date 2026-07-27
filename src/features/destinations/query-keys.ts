export const destinationKeys = {
  all: ["destinations"] as const,
  list: (filters: Record<string, string | undefined>) =>
    ["destinations", "list", filters] as const,
  featured: ["featured-destinations"] as const,
  detail: (destinationId: string) => ["destination", destinationId] as const,
  bySlug: (slug: string) => ["destination-by-slug", slug] as const,
};
