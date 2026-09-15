// Skeleton shape-matched a InvestmentCard (UX-01): misma geometría, cero CLS.

import { Skeleton } from '../ui/Skeleton';

export default function InvestmentCardSkeleton() {
  return (
    <div aria-hidden className="flex h-full flex-col border border-line bg-paper">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="flex flex-1 flex-col p-6">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-2/3" />
        <div className="mt-6 space-y-3 border-t border-hairline pt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-4 h-3 w-full" />
        <div className="mt-auto pt-6">
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
    </div>
  );
}
