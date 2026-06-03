import { Skeleton, SkeletonList } from "@/app/components/ui/Skeleton";

export default function ConversacionesLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      <SkeletonList items={10} />
    </div>
  );
}
