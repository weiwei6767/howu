import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton w="80px" h="0.9rem" rounded="sm" />
      <div className="flex flex-col gap-2">
        <Skeleton w="80px" h="0.7rem" rounded="sm" />
        <Skeleton w="160px" h="2.2rem" />
        <SkeletonText lines={1} />
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-[var(--color-paper-line)] pb-5">
        <div className="flex flex-col gap-2">
          <Skeleton w="80px" h="0.7rem" rounded="sm" />
          <Skeleton w="60px" h="2.2rem" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton w="80px" h="0.7rem" rounded="sm" />
          <Skeleton w="60px" h="2.2rem" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton w="120px" h="0.9rem" rounded="sm" />
        <ul className="flex flex-col">
          {Array.from({ length: 8 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 py-2.5 border-b border-[var(--color-paper-line)]"
            >
              <Skeleton w="2rem" h="0.9rem" rounded="sm" />
              <Skeleton h="0.9rem" rounded="sm" className="flex-1" />
              <Skeleton w="40px" h="1rem" rounded="sm" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
