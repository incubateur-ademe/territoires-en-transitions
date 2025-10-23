import { Button } from '@/ui';
import { APP_HEADER_ID } from '../layout/header/header';

const ScrollTopButton = ({ className = '' }: { className?: string }) => {
  return (
    <Button
      className={className}
      variant="underlined"
      icon="arrow-up-fill"
      onClick={() =>
        document
          .getElementById(APP_HEADER_ID)
          ?.scrollIntoView({ behavior: 'smooth' })
      }
    >
      Haut de page
    </Button>
  );
};

export default ScrollTopButton;
