export const ProgressBar = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => (
  <div className={className}>
    <div className="w-full h-full bg-grey925">
      <div
        className="h-full bg-bf525 max-w-full"
        style={{width: `${value}%`}}
      ></div>
    </div>
  </div>
);
