'use client';

/* eslint-disable react/no-unescaped-entities */
import {Button} from '@tet/ui';
import Section from '@components/sections/Section';

type NewsletterProps = {
  titre: string;
  description?: string;
  cta: {
    label: string;
    url: string;
  };
  className?: string;
};

const Newsletter = ({titre, description, cta, className}: NewsletterProps) => {
  return (
    <Section className="gap-0" containerClassName={className}>
      <h2 className="mb-3">{titre}</h2>
      <p>{description}</p>
      <Button href={cta.url} external={!cta.url.startsWith('/')}>
        {cta.label}
      </Button>
    </Section>
  );
};

export default Newsletter;
