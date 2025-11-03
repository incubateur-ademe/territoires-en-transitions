import Image from 'next/image';
import AdemeImage from './ademe.logo.svg?url';

export const AdemeLogo = ({ className }: { className?: string }) => {
  return <Image className={className} src={AdemeImage} alt="ADEME" />;
};
