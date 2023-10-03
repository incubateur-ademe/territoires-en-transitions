import classNames from 'classnames';

type CardsWrapperProps = {
  children: React.ReactNode;
  cols: number;
  className?: string;
};

const CardsWrapper = ({children, cols, className}: CardsWrapperProps) => {
  return (
    <div
      className={classNames(
        'grid gap-8 grid-cols-1 md:grid-cols-2',
        {
          'lg:grid-cols-3': cols === 3,
          'lg:grid-cols-4': cols === 4,
          'lg:grid-cols-5': cols === 5,
        },
        className,
      )}
    >
      {children}
    </div>
  );
};

export default CardsWrapper;
