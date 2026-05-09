import { Skeleton } from "@/components/ui/Skeleton";

export default function AlbumLoading() {
  return (
    <div className="flex flex-col gap-7">
      <Skeleton w="80px" h="0.9rem" rounded="sm" />
      <div className="flex flex-col gap-2">
        <Skeleton w="60px" h="0.7rem" rounded="sm" />
        <Skeleton w="160px" h="2.2rem" />
        <Skeleton w="120px" h="0.9rem" rounded="sm" />
      </div>
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="surface px-3 py-3 flex items-center gap-4">
            <Skeleton w="64px" h="64px" rounded="md" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton w="60%" h="1.4rem" />
              <Skeleton w="30%" h="0.7rem" rounded="sm" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
