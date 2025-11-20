'use client';

import Section from '@/site/components/sections/Section';
import { Button } from '@tet/ui';

type EquipePlateformeProps = {
  titre: string;
  citation?: string;
  description?: string;
  cta: string;
};

const EquipePlateforme = ({
  titre,
  citation,
  description,
  cta,
}: EquipePlateformeProps) => {
  return (
    <Section containerClassName="max-md:!py-6 md:max-lg:!py-12 lg:!py-20">
      <h2 className="text-primary-8 md:text-center mb-1">{titre}</h2>
      {!!citation && (
        <h4 className="text-primary-7 md:text-center text-[24px] leading-[32px] mb-1">
          {citation}
        </h4>
      )}

      {!!description && (
        <p className="text-primary-10 md:text-center md:text-[18px] leading-[30px] mb-0">
          {description}
        </p>
      )}

      <Button
        href="https://beta.gouv.fr/startups/territoires-en-transitions.html#equipe"
        variant="outlined"
        iconPosition="left"
        external
        className="!mx-auto max-lg:mt-2 lg:mt-6"
      >
        {cta}
      </Button>
    </Section>
  );
};

export default EquipePlateforme;
