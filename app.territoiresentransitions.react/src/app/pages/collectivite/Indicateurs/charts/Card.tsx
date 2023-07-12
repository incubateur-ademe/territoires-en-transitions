import classNames from 'classnames';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

// conteneur du graphe
export const Card = ({children, className}: CardProps): JSX.Element => {
  return (
    <div
      className={classNames('h-80 bg-white rounded-lg p-4 border', className)}
    >
      {children}
    </div>
  );
};
