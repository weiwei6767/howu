import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function MemoriesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton w="80px" h="0.7rem" rounded="sm" />
        <Skeleton w="200px" h="2.2rem" />
      </div>
      <section className="border-b border-[var(--color-paper-line)] pb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton w="120px" h="0.9rem" rounded="sm" />
          <Skeleton w="80px" h="0.7rem" rounded="sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton w="60px" h="0.7rem" rounded="sm" />
            <Skeleton w="80px" h="2rem" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton w="40px" h="0.7rem" rounded="sm" />
            <Skeleton w="80px" h="2rem" />
          </div>
        </div>
      </section>
      <SkeletonText lines={2} />
      <div className="flex flex-col gap-1 border-y border-[var(--color-paper-line)]">
        <Skeleton h="64px" rounded="none" />
        <Skeleton h="64px" rounded="none" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} h="100%" className="aspect-square !w-full" rounded="sm" />
        ))}
      </div>
    </div>
  );
}
