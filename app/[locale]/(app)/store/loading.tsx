import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function StoreLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton w="80px" h="0.9rem" rounded="sm" />
      <div className="flex flex-col gap-2">
        <Skeleton w="60px" h="0.7rem" rounded="sm" />
        <Skeleton w="120px" h="2.2rem" />
        <SkeletonText lines={1} />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="surface overflow-hidden flex flex-col">
          <Skeleton h="240px" rounded="none" />
          <div className="p-5 flex flex-col gap-4">
            <Skeleton w="200px" h="1.6rem" />
            <SkeletonText lines={1} />
            <Skeleton h="3rem" />
            <SkeletonText lines={3} />
            <Skeleton w="120px" h="2rem" rounded="md" />
          </div>
        </div>
      ))}
    </div>
  );
}
