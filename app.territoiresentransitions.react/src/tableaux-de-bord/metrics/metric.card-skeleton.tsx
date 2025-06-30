export const MetricCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 p-6 bg-white border border-grey-3 rounded-xl animate-pulse">
      <div className="h-14 w-10 bg-grey-3 rounded" />
      <div className="h-6 w-5/6 bg-grey-3 rounded" />
      <div className="h-4 w-3/4 bg-grey-3 rounded" />
    </div>
  );
};
