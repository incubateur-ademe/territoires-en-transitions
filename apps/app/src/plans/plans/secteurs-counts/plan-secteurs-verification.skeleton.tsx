export const ListeFichesSkeleton = () => (
  <div className="flex flex-col gap-2 p-4 animate-pulse">
    <div className="h-5 w-32 rounded-md bg-grey-3" />
    <ul className="mb-0 pl-0 list-none border-t border-grey-3">
      {[1, 2, 3, 4, 5].map((ligne) => (
        <li key={ligne} className="py-3 border-b border-grey-3">
          <div className="h-5 w-4/5 rounded-md bg-grey-3" />
        </li>
      ))}
    </ul>
  </div>
);

export const DescriptionSkeleton = () => (
  <div className="flex flex-col animate-pulse">
    <div className="flex h-[1lh] items-center text-sm">
      <div className="h-3.5 w-full rounded-md bg-grey-3" />
    </div>
    <div className="flex h-[1lh] items-center text-sm">
      <div className="h-3.5 w-3/5 rounded-md bg-grey-3" />
    </div>
  </div>
);
