import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function UsLoading() {
  return (
    <div className="flex flex-col gap-7">
      <Skeleton h="320px" rounded="lg" />
      <div className="flex items-baseline justify-between border-b border-[var(--color-paper-line)] pb-4">
        <div className="flex flex-col gap-2">
          <Skeleton w="80px" h="0.7rem" rounded="sm" />
          <Skeleton w="80px" h="2rem" />
        </div>
        <Skeleton w="100px" h="0.7rem" rounded="sm" />
      </div>
      <div className="flex flex-col gap-3 border-b border-[var(--color-paper-line)] pb-5">
        <Skeleton w="120px" h="0.9rem" rounded="sm" />
        <SkeletonText lines={2} />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton w="120px" h="0.9rem" rounded="sm" />
        <Skeleton h="60px" rounded="md" />
        <Skeleton h="60px" rounded="md" />
      </div>
    </div>
  );
}
