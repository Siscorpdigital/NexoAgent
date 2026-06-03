import { SkeletonList } from "@/app/components/ui/Skeleton";

export default function ConversacionesLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="mb-6">
        <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
      </div>

      <SkeletonList items={8} />
    </div>
  );
}
