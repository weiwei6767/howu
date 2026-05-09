import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function HistoryLoading() {
  return (
    <div className="flex flex-col gap-7">
      <Skeleton w="80px" h="0.9rem" rounded="sm" />
      <div className="flex flex-col gap-2">
        <Skeleton w="80px" h="0.7rem" rounded="sm" />
        <Skeleton w="200px" h="2.2rem" />
        <SkeletonText lines={1} />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between border-b border-[var(--color-paper-line)] pb-2">
            <Skeleton w="140px" h="1.5rem" />
            <Skeleton w="40px" h="0.7rem" rounded="sm" />
          </div>
          <ul className="flex flex-col">
            {Array.from({ length: 4 }).map((_, j) => (
              <li
                key={j}
                className="flex items-center gap-4 py-3 border-b border-[var(--color-paper-line)]"
              >
                <Skeleton w="2.5rem" h="1.7rem" />
                <div className="flex-1 flex flex-col gap-1">
                  <Skeleton h="0.9rem" rounded="sm" />
                  <Skeleton w="60%" h="0.7rem" rounded="sm" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
