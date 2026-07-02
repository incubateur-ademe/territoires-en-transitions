export const SubactionIndicateurSkeleton = () => {
  return (
    <div className="flex flex-col gap-2 p-4 pb-8 border border-grey-3 rounded-md">
      <div className="h-3 w-4/5 bg-grey-3 rounded animate-pulse" />
      <div className="h-3 w-2/3 bg-grey-3 rounded animate-pulse" />
    </div>
  );
};
