'use client';

import {Button} from '@tet/ui';

type PAIButtonProps = {
  label: string;
};

const PAIButton = ({label}: PAIButtonProps) => {
  return (
    <Button href="/contact?panier=true" className="mt-6 max-lg:mx-auto">
      {label}
    </Button>
  );
};

export default PAIButton;
