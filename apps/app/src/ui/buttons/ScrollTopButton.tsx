import { Button } from '@/ui';

const ScrollTopButton = ({ className = '' }: { className?: string }) => {
  return (
    <Button
      className={className}
      variant="underlined"
      icon="arrow-up-fill"
      onClick={() =>
        document
          .getElementById('app-header')
          ?.scrollIntoView({ behavior: 'smooth' })
      }
    >
      Haut de page
    </Button>
  );
};

export default ScrollTopButton;
