export const ReferentielCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col-reverse items-center xl:flex-row xl:justify-between gap-4 p-6 bg-white border border-grey-3 rounded-xl animate-pulse">
        <div className="flex flex-col gap-6 w-2/3">
          <div className="h-16 w-16 bg-grey-3 rounded-full" />
          <div className="h-5 w-2/3 bg-grey-3 rounded" />
          <div className="h-5 w-2/3 bg-grey-3 rounded" />
          <div className="flex gap-2">
            <div className="h-3 w-2/5 bg-grey-3 rounded" />
            <div className="h-3 w-2/5 bg-grey-3 rounded" />
          </div>
          <div className="h-12 w-2/5 bg-grey-3 rounded" />
        </div>
        <div className="h-48 w-48 mr-4 my-auto bg-grey-3 rounded-full" />
      </div>
    </div>
  );
};
