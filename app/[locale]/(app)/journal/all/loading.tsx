import { Skeleton } from "@/components/ui/Skeleton";

export default function JournalAllLoading() {
  return (
    <div className="flex flex-col gap-7">
      <Skeleton w="80px" h="0.9rem" rounded="sm" />
      <div className="flex flex-col gap-2">
        <Skeleton w="80px" h="0.7rem" rounded="sm" />
        <Skeleton w="160px" h="2.2rem" />
        <Skeleton w="120px" h="0.9rem" rounded="sm" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <section key={i} className="flex flex-col gap-3">
          <Skeleton w="120px" h="1.4rem" rounded="sm" className="border-b border-[var(--color-paper-line)] pb-2" />
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <li key={j} className="surface px-4 py-3.5 flex flex-col gap-2">
                <Skeleton w="60%" h="0.9rem" rounded="sm" />
                <Skeleton w="100%" h="2.5rem" rounded="sm" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
