import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-16">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-6 w-64" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </main>
  );
}
