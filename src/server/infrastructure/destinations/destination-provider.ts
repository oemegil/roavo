import "server-only";

export type ProviderDestinationCandidate = {
  provider: "MANUAL" | "INTERNAL_CATALOG";
  providerId: string;
  name: string;
  type: string;
  countryCode: string;
  countryName: string;
  regionName: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
};

export type DestinationProviderSearchOptions = {
  limit?: number;
  countryCode?: string;
};

/**
 * Provider-independent contract. Implementations must not leak SDK types.
 * External providers are optional; MVP uses the internal catalog only.
 */
export interface DestinationProvider {
  readonly name: string;
  searchDestinations(
    query: string,
    options?: DestinationProviderSearchOptions,
  ): Promise<ProviderDestinationCandidate[]>;
  getDestinationDetails(
    providerReference: string,
  ): Promise<ProviderDestinationCandidate | null>;
  healthCheck(): Promise<{ ok: boolean; provider: string }>;
}
