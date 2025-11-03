import Image from 'next/image';
import TerritoiresEnTransitionsImage from './territoires-en-transitions.logo.svg?url';

export const TerritoiresEnTransitionsLogo = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <Image
      className={className}
      src={TerritoiresEnTransitionsImage}
      alt="Territoires en Transitions"
    />
  );
};
