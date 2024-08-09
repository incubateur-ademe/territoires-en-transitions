'use client';

import Section from '@tet/site/components/sections/Section';
import { Button } from '@tet/ui';
import classNames from 'classnames';

type NewsletterProps = {
  titre: string;
  description?: string;
  className?: string;
};

const Newsletter = ({ titre, description, className }: NewsletterProps) => {
  return (
    <Section className={classNames('gap-0', className)}>
      <h2 className="mb-3">{titre}</h2>
      <p>{description}</p>
      <Button href="https://cloud.contact.ademe.fr/inscription-tete" external>
        {"S'inscrire"}
      </Button>
    </Section>
  );
};

export default Newsletter;
