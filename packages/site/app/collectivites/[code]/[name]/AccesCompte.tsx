'use client';

import {Button} from '@tet/ui';

type AccesCompteProps = {
  description: string;
  cta: {
    label: string;
    url: string;
  };
};

const AccesCompte = ({description, cta}: AccesCompteProps) => {
  return (
    <div className="flex flex-col items-center md:rounded-[10px] bg-primary-1 md:bg-white py-10 px-8 lg:p-8">
      <p className="text-center text-primary-8 font-bold text-[18px] leading-[28px]">
        {description}
      </p>
      <Button href={cta.url} external={!cta.url.startsWith('/')}>
        {cta.label}
      </Button>
    </div>
  );
};

export default AccesCompte;
