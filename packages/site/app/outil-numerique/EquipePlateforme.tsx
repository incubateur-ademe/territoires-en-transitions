'use client';

import Section from '@components/sections/Section';
import {Button} from '@tet/ui';

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
    <Section>
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
        className="!mx-auto"
      >
        {cta}
      </Button>
    </Section>
  );
};

export default EquipePlateforme;
