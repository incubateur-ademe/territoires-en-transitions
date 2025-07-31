import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

type LoadingCardProps = {
  title?: string;
};

const LoadingCard = ({ title }: LoadingCardProps) => {
  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8">
      {title !== undefined && <h5 className="text-primary-8 mb-0">{title}</h5>}
      <SpinnerLoader className="mx-auto my-8" />
    </div>
  );
};

export default LoadingCard;
