export const FicheActionCardSkeleton = () => (
  <div className="animate-pulse flex flex-col gap-3 h-full px-4 py-[1.125rem] border border-grey-3 bg-white rounded-lg">
    <div className="flex gap-3">
      <div className="h-5 w-14 rounded-md bg-grey-3" />
      <div className="h-5 w-16 rounded-md bg-grey-3" />
    </div>
    <div className="h-6 rounded-md bg-grey-3" />
    <div className="h-5 w-4/5 rounded-md bg-grey-3" />
    <div className="h-5 w-52 rounded-md bg-grey-3" />
  </div>
);
