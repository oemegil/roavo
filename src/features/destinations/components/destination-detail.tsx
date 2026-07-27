"use client";

import Link from "next/link";

import type { DestinationDetailDto } from "@/features/destinations/dto";
import {
  CATALOG_DESTINATION_TYPE_LABELS,
  DESTINATION_BEST_FOR_LABELS,
  DESTINATION_BUDGET_LABELS,
  DESTINATION_CATEGORY_LABELS,
  type CatalogDestinationType,
  type DestinationBestFor,
  type DestinationBudgetLevel,
  type DestinationCategory,
} from "@/server/domain/destinations/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function DestinationDetailView({
  destination,
}: {
  destination: DestinationDetailDto;
}) {
  const duration =
    destination.minimumRecommendedDays && destination.maximumRecommendedDays
      ? `${destination.minimumRecommendedDays}–${destination.maximumRecommendedDays} gün`
      : null;

  return (
    <article className="space-y-8">
      <div className="bg-muted relative aspect-[21/9] w-full overflow-hidden rounded-xl">
        {destination.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={destination.heroImage.url}
            alt={destination.heroImage.alt}
            className="size-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
            {destination.name}
          </div>
        )}
      </div>

      <header className="space-y-3">
        <p className="text-muted-foreground text-sm">
          {[destination.regionName, destination.countryName]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <h1 className="text-heading">{destination.name}</h1>
        <p className="text-body leading-relaxed">{destination.shortDescription}</p>
      </header>

      <Alert>
        <AlertTitle>Planlama notu</AlertTitle>
        <AlertDescription>{destination.disclaimer}</AlertDescription>
      </Alert>

      <dl className="grid gap-4 sm:grid-cols-2">
        <Meta
          label="Bütçe seviyesi"
          value={`${DESTINATION_BUDGET_LABELS[destination.budgetLevel as DestinationBudgetLevel] ?? destination.budgetLevel} (yaklaşık)`}
        />
        <Meta label="Önerilen süre" value={duration ?? "Belirtilmemiş"} />
        <Meta
          label="Ana dil"
          value={destination.primaryLanguage?.toUpperCase() ?? "Belirtilmemiş"}
        />
        <Meta
          label="Para birimi"
          value={destination.currencyCode ?? "Belirtilmemiş"}
        />
        <Meta label="Saat dilimi" value={destination.timezone ?? "Belirtilmemiş"} />
        <Meta
          label="Tür"
          value={
            CATALOG_DESTINATION_TYPE_LABELS[
              destination.type as CatalogDestinationType
            ] ?? destination.type.replaceAll("_", " ")
          }
        />
      </dl>

      {destination.longDescription ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Genel bakış</h2>
          <p className="text-body leading-relaxed whitespace-pre-wrap">
            {destination.longDescription}
          </p>
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Kategoriler</h2>
        <ul className="flex flex-wrap gap-2">
          {destination.categories.map((category) => (
            <li
              key={category}
              className="bg-muted rounded-md px-2 py-1 text-xs"
            >
              {DESTINATION_CATEGORY_LABELS[category as DestinationCategory] ??
                category}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Kimler için</h2>
        <ul className="flex flex-wrap gap-2">
          {destination.bestFor.map((tag) => (
            <li key={tag} className="bg-muted rounded-md px-2 py-1 text-xs">
              {DESTINATION_BEST_FOR_LABELS[tag as DestinationBestFor] ?? tag}
            </li>
          ))}
        </ul>
      </section>

      {destination.practicalNotes ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Pratik notlar</h2>
          <p className="text-body leading-relaxed whitespace-pre-wrap">
            {destination.practicalNotes}
          </p>
          <p className="text-muted-foreground text-xs">
            Yalnızca editoryal rehberlik — yasal, vize, güvenlik veya canlı operasyonel
            tavsiye değildir.
          </p>
        </section>
      ) : null}

      {destination.heroImage?.attribution ? (
        <p className="text-muted-foreground text-xs">
          Görsel: {destination.heroImage.attribution}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href={`/trips/new?destinationId=${destination.id}`}>
            Buraya gezi planla
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/destinations">Destinasyonlara dön</Link>
        </Button>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
