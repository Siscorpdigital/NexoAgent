import { Skeleton, SkeletonCard } from "@/app/components/ui/Skeleton";

export default function AgendaLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5" style={{ border: "1px solid #E2E9F0" }}>
            <Skeleton className="h-10 w-20 mb-2" />
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Google Calendar */}
      <div className="bg-white rounded-xl p-6 mb-6" style={{ border: "1px solid #E2E9F0" }}>
        <Skeleton className="h-6 w-56 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl p-6 mb-6" style={{ border: "1px solid #E2E9F0" }}>
        <Skeleton className="h-6 w-48 mb-5" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Lista de citas */}
      <SkeletonCard />
    </div>
  );
}
