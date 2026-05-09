import { Skeleton } from "@/components/ui/Skeleton";

export default function JournalLoading() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <Skeleton w="80px" h="0.7rem" rounded="sm" />
        <Skeleton w="180px" h="2.2rem" />
      </div>
      <div className="flex items-center justify-between border-b border-[var(--color-paper-line)] pb-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton w="60px" h="0.9rem" rounded="sm" />
          <Skeleton w="100px" h="0.7rem" rounded="sm" />
        </div>
        <Skeleton w="80px" h="36px" rounded="md" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton w="160px" h="1.4rem" />
        {/* 月曆 grid 6 行 7 格 */}
        <div className="surface p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="aspect-square">
                <Skeleton h="100%" rounded="sm" className="!w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
