import "server-only";

import {
  findActiveDestinationById,
  searchActiveDestinations,
} from "@/server/repositories/destination-repository";
import type {
  DestinationProvider,
  DestinationProviderSearchOptions,
  ProviderDestinationCandidate,
} from "@/server/infrastructure/destinations/destination-provider";

/**
 * Catalog-backed provider — no external SDK. Used when DESTINATION_PROVIDER=internal.
 */
export class InternalCatalogDestinationProvider implements DestinationProvider {
  readonly name = "INTERNAL_CATALOG";

  async searchDestinations(
    query: string,
    options: DestinationProviderSearchOptions = {},
  ): Promise<ProviderDestinationCandidate[]> {
    const { items } = await searchActiveDestinations({
      q: query,
      countryCode: options.countryCode,
      limit: options.limit ?? 20,
    });

    return items.map((destination) => ({
      provider: "INTERNAL_CATALOG" as const,
      providerId: destination.id,
      name: destination.name,
      type: destination.type,
      countryCode: destination.countryCode,
      countryName: destination.countryName,
      regionName: destination.regionName,
      latitude: destination.latitude ? Number(destination.latitude) : null,
      longitude: destination.longitude ? Number(destination.longitude) : null,
      timezone: destination.timezone,
    }));
  }

  async getDestinationDetails(
    providerReference: string,
  ): Promise<ProviderDestinationCandidate | null> {
    const destination = await findActiveDestinationById(providerReference);
    if (!destination) return null;
    return {
      provider: "INTERNAL_CATALOG",
      providerId: destination.id,
      name: destination.name,
      type: destination.type,
      countryCode: destination.countryCode,
      countryName: destination.countryName,
      regionName: destination.regionName,
      latitude: destination.latitude ? Number(destination.latitude) : null,
      longitude: destination.longitude ? Number(destination.longitude) : null,
      timezone: destination.timezone,
    };
  }

  async healthCheck(): Promise<{ ok: boolean; provider: string }> {
    return { ok: true, provider: this.name };
  }
}

export function getDestinationProvider(): DestinationProvider {
  return new InternalCatalogDestinationProvider();
}
