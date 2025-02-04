'use client';

import posthog from 'posthog-js';

import Section from '@/site/components/sections/Section';
import { Button } from '@/ui';

type ContactProps = {
  description: string;
  cta: string;
};

const Contact = ({ description, cta }: ContactProps) => {
  return (
    <Section
      className="items-center justify-center !gap-8"
      containerClassName="bg-primary-7 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      <h2 className="text-white text-center max-w-3xl mb-0">{description}</h2>
      <Button
        href="/contact?objet=programme"
        onClick={() => posthog.capture('contact_programme')}
        variant="secondary"
        className="!bg-[#FFE8BD] !border-[#FFE8BD] !text-primary-7 hover:!text-primary-8"
      >
        {cta}
      </Button>
    </Section>
  );
};

export default Contact;
