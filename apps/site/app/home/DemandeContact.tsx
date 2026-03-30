'use client';

import posthog from 'posthog-js';

import Section from '@/site/components/sections/Section';
import { Button } from '@tet/ui';

type DemandeContactProps = {
  description: string;
  cta: string;
};

const DemandeContact = ({ description, cta }: DemandeContactProps) => {
  return (
    <Section
      className="items-center justify-center !gap-8"
      containerClassName="bg-primary-7 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      <h2 className="text-white text-center max-w-5xl mb-0">{description}</h2>
      <Button
        href="/contact"
        onClick={() => posthog.capture('demande_contact')}
        variant="secondary"
        className="!bg-[#FFE8BD] !border-[#FFE8BD] !text-primary-7 hover:!text-primary-8"
      >
        {cta}
      </Button>
    </Section>
  );
};

export default DemandeContact;
