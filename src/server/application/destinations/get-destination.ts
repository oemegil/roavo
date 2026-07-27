import "server-only";

import { AppError } from "@/lib/errors";
import { createRequestLogger } from "@/lib/logging/logger";
import {
  toDestinationDetailDto,
  type DestinationDetailDto,
} from "@/features/destinations/dto";
import {
  findActiveDestinationById,
  findActiveDestinationBySlug,
  findDestinationByIdAnyStatus,
} from "@/server/repositories/destination-repository";

export async function getDestinationByIdService(input: {
  destinationId: string;
  correlationId?: string;
}): Promise<DestinationDetailDto> {
  const log = createRequestLogger(input.correlationId ?? "destination-detail");
  const destination = await findActiveDestinationById(input.destinationId);

  if (!destination) {
    const any = await findDestinationByIdAnyStatus(input.destinationId);
    if (any && any.status !== "ACTIVE") {
      throw new AppError({
        code: "DESTINATION_INACTIVE",
        message: "This destination is not available.",
        status: 404,
      });
    }
    throw new AppError({
      code: "DESTINATION_NOT_FOUND",
      message: "Destination not found.",
      status: 404,
    });
  }

  log.info("Destination detail viewed", { destinationId: destination.id });
  return toDestinationDetailDto(destination);
}

export async function getDestinationBySlugService(input: {
  slug: string;
  correlationId?: string;
}): Promise<DestinationDetailDto> {
  const log = createRequestLogger(input.correlationId ?? "destination-by-slug");
  const destination = await findActiveDestinationBySlug(input.slug);

  if (!destination) {
    throw new AppError({
      code: "DESTINATION_NOT_FOUND",
      message: "Destination not found.",
      status: 404,
    });
  }

  log.info("Destination detail viewed", {
    destinationId: destination.id,
    slug: destination.slug,
  });
  return toDestinationDetailDto(destination);
}
