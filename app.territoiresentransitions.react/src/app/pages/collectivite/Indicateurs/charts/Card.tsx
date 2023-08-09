import classNames from 'classnames';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  dataTest?: string;
};

// conteneur du graphe
export const Card = ({
  children,
  className,
  dataTest,
}: CardProps): JSX.Element => {
  return (
    <div
      className={classNames('h-80 bg-white rounded-lg p-4 border', className)}
      data-test={dataTest}
    >
      {children}
    </div>
  );
};
