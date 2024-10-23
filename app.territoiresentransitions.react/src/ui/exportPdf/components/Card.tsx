import { twToCss } from '../utils';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

const Card = ({ children, className }: CardProps) => {
  return (
    <div
      style={twToCss(
        `border border-grey-3 rounded-lg py-5 px-4 text-xs ${className}`
      )}
    >
      {children}
    </div>
  );
};

export default Card;
