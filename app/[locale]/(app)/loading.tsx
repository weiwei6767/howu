import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3">
        <div className="flex flex-col gap-2">
          <Skeleton w="120px" h="0.7rem" rounded="sm" />
          <Skeleton w="160px" h="0.9rem" rounded="sm" />
        </div>
        <Skeleton w="64px" h="32px" rounded="full" />
      </div>
      <Skeleton h="36px" w="200px" />
      <SkeletonText lines={2} />
      <div className="flex flex-col gap-3 mt-2">
        <Skeleton h="56px" rounded="md" />
        <Skeleton h="56px" rounded="md" />
        <Skeleton h="56px" rounded="md" />
      </div>
    </div>
  );
}
