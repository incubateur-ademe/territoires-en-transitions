import Image from 'next/image';
import RepubliqueFrancaiseImage from './republique-francaise.logo.svg?url';

export const RepubliqueFrancaiseLogo = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <Image
      className={className}
      src={RepubliqueFrancaiseImage}
      alt="République française"
    />
  );
};
