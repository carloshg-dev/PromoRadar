import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-line/60", className)} />;
}

export function ProdutoCardSkeleton() {
  return (
    <div className="card-grad rounded-2xl border border-line p-4">
      <div className="mb-3 flex justify-between"><Skeleton className="h-5 w-20" /><Skeleton className="h-6 w-14" /></div>
      <Skeleton className="mb-2 h-4 w-full" /><Skeleton className="mb-4 h-4 w-2/3" />
      <Skeleton className="mb-3 h-7 w-28" />
      <div className="flex justify-between"><Skeleton className="h-3 w-16" /><Skeleton className="h-8 w-24" /></div>
    </div>
  );
}

export function GridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => <ProdutoCardSkeleton key={i} />)}
    </div>
  );
}
