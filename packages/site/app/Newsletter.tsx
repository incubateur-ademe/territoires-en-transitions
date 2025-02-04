'use client';

import posthog from 'posthog-js';

import Section from '@/site/components/sections/Section';
import { Button } from '@/ui';

type NewsletterProps = {
  titre: string;
  description?: string;
  ctaLinkedin: string;
  ctaNewsletter: string;
};

const Newsletter = ({
  titre,
  description,
  ctaLinkedin,
  ctaNewsletter,
}: NewsletterProps) => {
  return (
    <Section containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20">
      <h2 className="text-center mb-0">{titre}</h2>
      <p className="text-center text-grey-9 text-lg font-bold mb-0">
        {description}
      </p>
      <div className="flex max-md:flex-col justify-center items-center gap-4 md:mt-4">
        <Button
          href="https://www.linkedin.com/showcase/territoire-engage-transition-ecologique/"
          variant="outlined"
          external
        >
          {ctaLinkedin}
        </Button>
        <Button
          href="https://cloud.contact.ademe.fr/inscription-tete"
          onClick={() => posthog.capture('inscription_newsletter')}
          external
        >
          {ctaNewsletter}
        </Button>
      </div>
    </Section>
  );
};

export default Newsletter;
