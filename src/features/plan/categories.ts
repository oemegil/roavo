import type { TravelInterest } from "@/server/domain/trips/constants";

/** MVP plan categories shown in the wizard (Türkçe etiketler). */
export const PLAN_CATEGORY_OPTIONS: Array<{
  value: TravelInterest;
  label: string;
}> = [
  { value: "HISTORY", label: "Tarih" },
  { value: "NATURE", label: "Doğa" },
  { value: "MUSEUMS", label: "Müze" },
  { value: "NIGHTLIFE", label: "Gece hayatı" },
  { value: "FOOD", label: "Yemek" },
  { value: "ART", label: "Sanat" },
  { value: "ARCHITECTURE", label: "Mimari" },
  { value: "SHOPPING", label: "Alışveriş" },
  { value: "PHOTOGRAPHY", label: "Fotoğraf" },
  { value: "WELLNESS", label: "Dinlenme" },
  { value: "ADVENTURE", label: "Macera" },
  { value: "LOCAL_CULTURE", label: "Yerel kültür" },
];
