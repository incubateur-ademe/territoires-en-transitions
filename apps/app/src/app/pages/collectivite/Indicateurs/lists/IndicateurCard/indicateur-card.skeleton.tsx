type Props = {
  hideChart?: boolean;
};

export const IndicateurCardSkeleton = ({ hideChart }: Props) => {
  return (
    <div className="animate-pulse flex flex-col gap-3 h-full p-6 border border-grey-3 bg-white rounded-lg">
      <div className="h-5 w-4/5 rounded-md bg-grey-3" />
      <div className="h-3 w-16 rounded-md bg-grey-3" />
      {!hideChart && <div className="aspect-[5/4] rounded-md bg-grey-3" />}
      <div className="h-3 w-52 rounded-md bg-grey-3" />
    </div>
  );
};
