import { Skeleton } from "@/components/ui/Skeleton";

export default function TemplatesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton w="80px" h="0.7rem" rounded="sm" />
          <Skeleton w="160px" h="2.2rem" />
        </div>
        <Skeleton w="56px" h="32px" rounded="md" />
      </div>
      <Skeleton h="2.5rem" />
      <ul className="flex flex-col">
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-4 py-4 border-b border-[var(--color-paper-line)]"
          >
            <Skeleton w="2rem" h="2rem" rounded="md" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton w="60%" h="1rem" rounded="sm" />
              <Skeleton w="40%" h="0.7rem" rounded="sm" />
            </div>
            <Skeleton w="40px" h="0.7rem" rounded="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
