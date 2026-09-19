import Image from 'next/image';
import electrifionsLaFrance from './electrifions-la-france.png';

export const ElectrifionsLaFranceLogo = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <Image
      src={electrifionsLaFrance}
      alt="Électrifions la France"
      width={80}
      height={80}
      className={className}
    />
  );
};
