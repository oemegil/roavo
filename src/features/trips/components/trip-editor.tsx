"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  PlaceSearchPicker,
  type PlaceCandidate,
} from "@/features/maps/components/place-search-picker";
import { ShowOnMapButton } from "@/features/maps/components/show-on-map-button";
import type { ItineraryItemDto, TripDetailDto } from "@/features/trips/dto";
import { formatTripStatus } from "@/lib/i18n/trip-labels";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SelectedPlace = {
  locationName: string;
  displayName: string;
  latitude: number;
  longitude: number;
  externalPlaceId: string;
};

type ItemDraft = {
  title: string;
  description: string;
  locationName: string;
  place: SelectedPlace | null;
  placeChanged: boolean;
};

function cityHintForTrip(trip: TripDetailDto, dayTitle: string | null): string {
  if (dayTitle?.includes("—")) {
    const left = dayTitle.split("—")[0]?.trim();
    if (left) return left;
  }
  if (dayTitle?.includes("-")) {
    const left = dayTitle.split("-")[0]?.trim();
    if (left && left.length < 40) return left;
  }
  if (trip.destinationRegionName?.includes("·")) {
    return trip.destinationRegionName.split("·")[0]?.trim() || "";
  }
  return trip.destinationName ?? trip.destinationRegionName ?? "";
}

function toItemDraft(item: ItineraryItemDto): ItemDraft {
  const hasPin = item.latitude != null && item.longitude != null;
  return {
    title: item.title,
    description: item.description ?? "",
    locationName: item.locationName ?? "",
    place: hasPin
      ? {
          locationName: item.locationName ?? item.title,
          displayName: item.locationName ?? item.title,
          latitude: item.latitude!,
          longitude: item.longitude!,
          externalPlaceId: item.externalPlaceId ?? "",
        }
      : null,
    placeChanged: false,
  };
}

function candidateToPlace(place: PlaceCandidate): SelectedPlace {
  return {
    locationName: place.name,
    displayName: place.displayName,
    latitude: place.latitude,
    longitude: place.longitude,
    externalPlaceId: place.osmId,
  };
}

export function TripEditor({ initialTrip }: { initialTrip: TripDetailDto }) {
  const router = useRouter();
  const [trip, setTrip] = useState(initialTrip);
  const [selectedDayId, setSelectedDayId] = useState(initialTrip.days[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [pending, setPending] = useState(false);

  const [editingDay, setEditingDay] = useState(false);
  const [dayTitle, setDayTitle] = useState("");
  const [dayNotes, setDayNotes] = useState("");

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);

  const [addingItem, setAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPlace, setNewItemPlace] = useState<SelectedPlace | null>(null);
  const [allowNoteOnly, setAllowNoteOnly] = useState(false);

  const orderedDays = useMemo(
    () => [...trip.days].sort((a, b) => a.position - b.position),
    [trip.days],
  );

  const selectedDay = useMemo(
    () => orderedDays.find((day) => day.id === selectedDayId) ?? orderedDays[0],
    [orderedDays, selectedDayId],
  );

  const selectedDayNumber = useMemo(() => {
    if (!selectedDay) return 1;
    const index = orderedDays.findIndex((day) => day.id === selectedDay.id);
    return index >= 0 ? index + 1 : 1;
  }, [orderedDays, selectedDay]);

  const totalItems = useMemo(
    () => trip.days.reduce((sum, day) => sum + day.items.length, 0),
    [trip.days],
  );

  const cityHint = useMemo(
    () => cityHintForTrip(trip, selectedDay?.title ?? null),
    [trip, selectedDay?.title],
  );

  const mapPins = useMemo(
    () =>
      orderedDays.flatMap((day, dayIndex) =>
        day.items
          .filter(
            (item) =>
              item.latitude != null && item.longitude != null && item.type !== "NOTE",
          )
          .map((item) => ({
            id: item.id,
            name: item.title,
            latitude: item.latitude!,
            longitude: item.longitude!,
            subtitle: item.locationName,
            dayNumber: dayIndex + 1,
            dayLabel: `Gün ${dayIndex + 1}${day.title ? ` · ${day.title}` : ""}`,
          })),
      ),
    [orderedDays],
  );

  const readOnly = trip.status === "ARCHIVED";

  function applyTrip(next: TripDetailDto) {
    setTrip(next);
    if (!next.days.some((day) => day.id === selectedDayId)) {
      setSelectedDayId(next.days[0]?.id ?? "");
    }
  }

  function startEditDay() {
    if (!selectedDay || readOnly) return;
    setEditingDay(true);
    setDayTitle(selectedDay.title ?? "");
    setDayNotes(selectedDay.notes ?? "");
    setEditingItemId(null);
    setItemDraft(null);
    setAddingItem(false);
  }

  function startEditItem(item: ItineraryItemDto) {
    if (readOnly) return;
    setEditingItemId(item.id);
    setItemDraft(toItemDraft(item));
    setEditingDay(false);
    setAddingItem(false);
  }

  function cancelEdits() {
    setEditingDay(false);
    setEditingItemId(null);
    setItemDraft(null);
    setAddingItem(false);
    setNewItemTitle("");
    setNewItemDescription("");
    setNewItemPlace(null);
    setAllowNoteOnly(false);
  }

  async function saveDay() {
    if (!selectedDay) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    const response = await fetch(`/api/v1/trips/${trip.id}/days/${selectedDay.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: dayTitle.trim() || null,
        notes: dayNotes.trim() || null,
      }),
    });
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Gün kaydedilemedi.");
      return;
    }
    applyTrip(payload.trip);
    setEditingDay(false);
    setSuccess("Gün güncellendi.");
    router.refresh();
  }

  async function saveItem(item: ItineraryItemDto) {
    if (!selectedDay || !itemDraft) return;
    const title = itemDraft.title.trim();
    if (!title) {
      setError("Başlık gerekli.");
      return;
    }
    setPending(true);
    setError(null);
    setSuccess(null);

    const body: Record<string, unknown> = {
      title,
      description: itemDraft.description.trim(),
      locationName:
        itemDraft.place?.locationName.trim() || itemDraft.locationName.trim() || "",
    };

    if (itemDraft.placeChanged && itemDraft.place) {
      body.latitude = itemDraft.place.latitude;
      body.longitude = itemDraft.place.longitude;
      body.externalPlaceId = itemDraft.place.externalPlaceId || null;
      body.locationName = itemDraft.place.locationName;
    }

    const response = await fetch(
      `/api/v1/trips/${trip.id}/days/${selectedDay.id}/items/${item.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Aktivite kaydedilemedi.");
      return;
    }
    applyTrip(payload.trip);
    setEditingItemId(null);
    setItemDraft(null);
    setSuccess(
      itemDraft.placeChanged
        ? "Aktivite ve harita pini güncellendi."
        : "Aktivite güncellendi. Harita pini aynı kaldı.",
    );
    router.refresh();
  }

  async function deleteItem(item: ItineraryItemDto) {
    if (!selectedDay || readOnly) return;
    const ok = window.confirm(`“${item.title}” silinsin mi?`);
    if (!ok) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    const response = await fetch(
      `/api/v1/trips/${trip.id}/days/${selectedDay.id}/items/${item.id}`,
      { method: "DELETE" },
    );
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Aktivite silinemedi.");
      return;
    }
    applyTrip(payload.trip);
    setEditingItemId(null);
    setItemDraft(null);
    setSuccess("Aktivite silindi.");
    router.refresh();
  }

  async function createItem() {
    if (!selectedDay) return;
    const title = newItemTitle.trim();
    if (!title) {
      setError("Yeni aktivite için başlık gerekli.");
      return;
    }
    if (!newItemPlace && !allowNoteOnly) {
      setError("Harita için bir yer seç veya “pinsiz not” işaretle.");
      return;
    }

    setPending(true);
    setError(null);
    setSuccess(null);
    const response = await fetch(
      `/api/v1/trips/${trip.id}/days/${selectedDay.id}/items`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newItemPlace ? "ATTRACTION" : "NOTE",
          title,
          description: newItemDescription.trim() || undefined,
          locationName: newItemPlace?.locationName,
          externalPlaceId: newItemPlace?.externalPlaceId,
          latitude: newItemPlace?.latitude,
          longitude: newItemPlace?.longitude,
        }),
      },
    );
    const payload = await response.json().catch(() => null);
    setPending(false);
    if (!response.ok) {
      setError(payload?.error?.message ?? "Aktivite eklenemedi.");
      return;
    }
    applyTrip(payload.trip);
    cancelEdits();
    setSuccess(
      newItemPlace ? "Yer eklendi ve haritada görünecek." : "Pinsiz not eklendi.",
    );
    router.refresh();
  }

  async function regeneratePlan() {
    setGenerating(true);
    setError(null);
    setSuccess(null);
    cancelEdits();
    const generateResponse = await fetch(
      `/api/v1/trips/${trip.id}/ai/generate-itinerary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedTripVersion: trip.updatedAt }),
      },
    );
    const generatePayload = await generateResponse.json().catch(() => null);
    if (!generateResponse.ok) {
      setGenerating(false);
      setError(
        generatePayload?.error?.message ??
          "Günlük program üretilemedi. Biraz sonra tekrar dene.",
      );
      return;
    }

    const applyResponse = await fetch(
      `/api/v1/trips/${trip.id}/ai/itinerary-previews/${generatePayload.previewId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedTripVersion: trip.updatedAt }),
      },
    );
    const applyPayload = await applyResponse.json().catch(() => null);
    setGenerating(false);
    if (!applyResponse.ok) {
      setError(applyPayload?.error?.message ?? "Günlük program uygulanamadı.");
      return;
    }
    if (applyPayload?.trip) {
      applyTrip(applyPayload.trip);
      setSelectedDayId(applyPayload.trip.days?.[0]?.id ?? selectedDayId);
    }
    setSuccess("Günlük program hazır. İstersen maddeleri sonra düzenleyebilirsin.");
    router.refresh();
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-caption tracking-[0.14em] uppercase">
          {formatTripStatus(trip.status)}
        </p>
        <h1 className="text-heading">{trip.title}</h1>
        <p className="text-muted-foreground text-body">
          {trip.originName && trip.originName !== "Belirtilmedi"
            ? `${trip.originName} → `
            : ""}
          {trip.destinationName ?? "Destinasyon belirlenmedi"} · {trip.startDate} –{" "}
          {trip.endDate}
        </p>
        <p className="text-muted-foreground text-sm">
          {trip.visibility === "PUBLIC"
            ? `Herkese açık · ${trip.likeCount} beğeni · ${trip.commentCount} yorum`
            : "Özel gezi"}
        </p>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" asChild variant="outline">
              <Link href="/trips">Gezilerime dön</Link>
            </Button>
            <Button type="button" asChild variant="outline">
              <Link href={`/trips/${trip.id}/settings`}>Gezi ayarları</Link>
            </Button>
            {totalItems === 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void regeneratePlan()}
                disabled={generating || pending}
              >
                {generating ? "Günlük programın hazırlanıyor…" : "AI ile plan oluştur"}
              </Button>
            ) : null}
          </div>
        ) : null}
        <ShowOnMapButton readyPins={mapPins} />
        {mapPins.length > 0 ? (
          <p className="text-muted-foreground text-xs">
            Harita seçilen yerlerin koordinatlarından gelir. Sadece metin düzenlemek
            pinleri bozmaz; yer değiştirince pin güncellenir.
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Haritada görmek için güne yer eklerken listeden bir konum seç.
          </p>
        )}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Güncelleme başarısız</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {success ? (
        <Alert>
          <AlertTitle>Kaydedildi</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}

      {readOnly ? (
        <Alert>
          <AlertTitle>Arşivlenmiş gezi</AlertTitle>
          <AlertDescription>Bu gezi yalnızca görüntülenebilir.</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {orderedDays.map((day, index) => (
          <button
            key={day.id}
            type="button"
            onClick={() => {
              setSelectedDayId(day.id);
              cancelEdits();
            }}
            className={`rounded-lg border px-3 py-2 text-sm whitespace-nowrap ${
              selectedDay?.id === day.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border"
            }`}
          >
            Gün {index + 1}
          </button>
        ))}
      </div>

      {selectedDay ? (
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>
                  Gün {selectedDayNumber}
                  {selectedDay.title ? ` · ${selectedDay.title}` : ""}
                </CardTitle>
                <CardDescription>{selectedDay.date}</CardDescription>
              </div>
              {!readOnly && !editingDay ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || generating}
                  onClick={startEditDay}
                >
                  Günü düzenle
                </Button>
              ) : null}
            </div>

            {editingDay ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="day-title">Gün başlığı</Label>
                  <Input
                    id="day-title"
                    value={dayTitle}
                    onChange={(e) => setDayTitle(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day-notes">Gün notu</Label>
                  <textarea
                    id="day-notes"
                    value={dayNotes}
                    rows={3}
                    disabled={pending}
                    onChange={(e) => setDayNotes(e.target.value)}
                    className="border-input bg-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => void saveDay()}
                  >
                    {pending ? "Kaydediliyor…" : "Günü kaydet"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={cancelEdits}
                  >
                    Vazgeç
                  </Button>
                </div>
              </div>
            ) : selectedDay.notes ? (
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {selectedDay.notes}
              </p>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-4">
            {selectedDay.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu gün için henüz program yok. Gittiğin yerleri aşağıdan ekle.
              </p>
            ) : null}

            <ul className="space-y-3">
              {selectedDay.items.map((item) => {
                const isEditing = editingItemId === item.id && itemDraft;
                const hasMapPin =
                  item.latitude != null && item.longitude != null && item.type !== "NOTE";
                return (
                  <li
                    key={item.id}
                    className="border-border space-y-3 rounded-xl border p-4"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`item-title-${item.id}`}>Başlık</Label>
                          <Input
                            id={`item-title-${item.id}`}
                            value={itemDraft.title}
                            disabled={pending}
                            onChange={(e) =>
                              setItemDraft({
                                ...itemDraft,
                                title: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-desc-${item.id}`}>Açıklama</Label>
                          <textarea
                            id={`item-desc-${item.id}`}
                            value={itemDraft.description}
                            rows={3}
                            disabled={pending}
                            onChange={(e) =>
                              setItemDraft({
                                ...itemDraft,
                                description: e.target.value,
                              })
                            }
                            className="border-input bg-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Harita yeri</p>
                          <PlaceSearchPicker
                            key={`edit-${item.id}-${cityHint}`}
                            cityHint={cityHint}
                            disabled={pending}
                            selectedLabel={
                              itemDraft.place?.displayName ??
                              (hasMapPin ? item.locationName : null)
                            }
                            onSelect={(place) =>
                              setItemDraft({
                                ...itemDraft,
                                place: candidateToPlace(place),
                                locationName: place.name,
                                placeChanged: true,
                                title: itemDraft.title.trim()
                                  ? itemDraft.title
                                  : place.name,
                              })
                            }
                            onClear={() =>
                              setItemDraft({
                                ...itemDraft,
                                place: null,
                                placeChanged: false,
                              })
                            }
                          />
                          {hasMapPin && !itemDraft.placeChanged ? (
                            <p className="text-muted-foreground text-xs">
                              Mevcut pin korunur. Değiştirmek için yeni yer seç.
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={pending}
                            onClick={() => void saveItem(item)}
                          >
                            {pending ? "Kaydediliyor…" : "Kaydet"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={cancelEdits}
                          >
                            Vazgeç
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium">{item.title}</p>
                            {item.source === "AI_GENERATED" ? (
                              <p className="text-muted-foreground text-xs">
                                AI üretimi — istediğin gibi düzenleyebilirsin
                              </p>
                            ) : null}
                            {item.locationName ? (
                              <p className="text-muted-foreground text-sm">
                                {item.locationName}
                                {hasMapPin ? " · haritada" : ""}
                              </p>
                            ) : null}
                          </div>
                          {!readOnly ? (
                            <div className="flex shrink-0 gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={pending || generating}
                                onClick={() => startEditItem(item)}
                              >
                                Düzenle
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={pending || generating}
                                onClick={() => void deleteItem(item)}
                              >
                                Sil
                              </Button>
                            </div>
                          ) : null}
                        </div>
                        {item.description ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {!readOnly ? (
              addingItem ? (
                <div className="border-border space-y-3 rounded-xl border border-dashed p-4">
                  <p className="text-sm font-medium">
                    Gün {selectedDayNumber} — yer / aktivite ekle
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="new-item-title">Başlık</Label>
                    <Input
                      id="new-item-title"
                      value={newItemTitle}
                      disabled={pending}
                      placeholder="Ne yaptın?"
                      onChange={(e) => setNewItemTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-item-desc">Kısa not</Label>
                    <textarea
                      id="new-item-desc"
                      value={newItemDescription}
                      rows={2}
                      disabled={pending}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      className="border-input bg-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Gittiğin yeri seç</p>
                    <PlaceSearchPicker
                      key={`add-${selectedDay.id}-${cityHint}`}
                      cityHint={cityHint}
                      disabled={pending || allowNoteOnly}
                      selectedLabel={newItemPlace?.displayName}
                      onSelect={(place) => {
                        setNewItemPlace(candidateToPlace(place));
                        setAllowNoteOnly(false);
                        if (!newItemTitle.trim()) {
                          setNewItemTitle(place.name);
                        }
                      }}
                      onClear={() => setNewItemPlace(null)}
                    />
                  </div>
                  <label className="text-muted-foreground flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={allowNoteOnly}
                      disabled={pending}
                      onChange={(e) => {
                        setAllowNoteOnly(e.target.checked);
                        if (e.target.checked) setNewItemPlace(null);
                      }}
                    />
                    Pinsiz not olarak kaydet (haritada çıkmaz)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() => void createItem()}
                    >
                      Ekle
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={cancelEdits}
                    >
                      Vazgeç
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending || generating}
                  onClick={() => {
                    setAddingItem(true);
                    setEditingDay(false);
                    setEditingItemId(null);
                    setItemDraft(null);
                  }}
                >
                  Yer / aktivite ekle
                </Button>
              )
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}
