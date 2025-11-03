import Image from 'next/image';
import ProgrammeTeteImage from './programme-tete.logo.svg?url';

export const ProgrammeTeteLogo = ({ className }: { className?: string }) => {
  return (
    <Image
      className={className}
      src={ProgrammeTeteImage}
      alt="Programme Territoire Engagé Transition Écologique"
    />
  );
};
