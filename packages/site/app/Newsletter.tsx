'use client';

/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';
import {Button} from '@tet/ui';
import classNames from 'classnames';

type NewsletterProps = {
  titre: string;
  description?: string;
  className?: string;
};

const Newsletter = ({titre, description, className}: NewsletterProps) => {
  return (
    <Section
      className={classNames('gap-0', className)}
      containerClassName="bg-primary-1 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
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
          Voir la page Linkedin
        </Button>
        <Button href="https://cloud.contact.ademe.fr/inscription-tete" external>
          S'inscrire
        </Button>
      </div>
    </Section>
  );
};

export default Newsletter;
