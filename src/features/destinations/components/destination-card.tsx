"use client";

import Link from "next/link";

import type { DestinationSummaryDto } from "@/features/destinations/dto";
import {
  DESTINATION_BUDGET_LABELS,
  DESTINATION_CATEGORY_LABELS,
  type DestinationBudgetLevel,
  type DestinationCategory,
} from "@/server/domain/destinations/constants";

export function DestinationCard({
  destination,
}: {
  destination: DestinationSummaryDto;
}) {
  const duration =
    destination.minimumRecommendedDays && destination.maximumRecommendedDays
      ? `${destination.minimumRecommendedDays}–${destination.maximumRecommendedDays} gün`
      : null;

  return (
    <article className="border-border overflow-hidden rounded-xl border">
      <div className="bg-muted relative aspect-[16/10] w-full">
        {destination.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={destination.heroImage.url}
            alt={destination.heroImage.alt}
            className="size-full object-cover"
          />
        ) : (
          <div
            className="text-muted-foreground flex size-full items-center justify-center text-sm"
            aria-hidden
          >
            {destination.name}
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold tracking-tight">
            <Link
              href={`/destinations/${destination.slug}`}
              className="hover:underline focus-visible:underline"
            >
              {destination.name}
            </Link>
          </h3>
          <p className="text-muted-foreground text-sm">
            {[destination.regionName, destination.countryName]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <p className="text-sm leading-relaxed">{destination.shortDescription}</p>
        <div className="flex flex-wrap gap-2">
          {destination.categories.slice(0, 3).map((category) => (
            <span
              key={category}
              className="bg-muted rounded-md px-2 py-1 text-xs"
            >
              {DESTINATION_CATEGORY_LABELS[category as DestinationCategory] ??
                category}
            </span>
          ))}
        </div>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <span>
            {DESTINATION_BUDGET_LABELS[
              destination.budgetLevel as DestinationBudgetLevel
            ] ?? destination.budgetLevel}{" "}
            (yaklaşık)
          </span>
          {duration ? <span>{duration} önerilir</span> : null}
        </div>
        <Link
          href={`/destinations/${destination.slug}`}
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Destinasyonu gör
        </Link>
      </div>
    </article>
  );
}
