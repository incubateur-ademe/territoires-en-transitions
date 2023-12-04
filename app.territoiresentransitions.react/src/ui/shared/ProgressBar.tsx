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
        className="h-full bg-primary max-w-full"
        style={{width: `${value}%`}}
      ></div>
    </div>
  </div>
);
