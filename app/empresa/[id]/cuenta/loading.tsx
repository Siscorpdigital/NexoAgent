import { Skeleton, SkeletonCard } from "@/app/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
