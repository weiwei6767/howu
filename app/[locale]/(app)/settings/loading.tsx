import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton w="80px" h="0.7rem" rounded="sm" />
        <Skeleton w="100px" h="2.2rem" />
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--color-paper-line)] border border-[var(--color-paper-line)] rounded-[var(--radius-card)] overflow-hidden">
        <Skeleton h="48px" rounded="none" className="!bg-white" />
        <Skeleton h="48px" rounded="none" className="!bg-white" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton w="80px" h="0.7rem" rounded="sm" />
          <Skeleton h="2.5rem" rounded="md" />
        </div>
      ))}
      <Skeleton w="100px" h="2.5rem" rounded="md" />
    </div>
  );
}
