import { Button } from '@tet/ui';
import { APP_HEADER_ID } from '../layout/header/header';
import { appLabels } from '@/app/labels/catalog';
import { RiArrowUpFill } from '@remixicon/react';

const ScrollTopButton = ({ className = '' }: { className?: string }) => {
  return (
    <Button
      className={className}
      variant="underlined"
      icon={<RiArrowUpFill />}
      onClick={() =>
        document
          .getElementById(APP_HEADER_ID)
          ?.scrollIntoView({ behavior: 'smooth' })
      }
    >
      {appLabels.hautDePage}
    </Button>
  );
};

export default ScrollTopButton;
