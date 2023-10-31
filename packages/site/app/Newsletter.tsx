/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/dstet/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import classNames from 'classnames';

type NewsletterProps = {
  titre: string;
  description?: string;
  className?: string;
};

const Newsletter = ({titre, description, className}: NewsletterProps) => {
  return (
    <Section className={classNames('gap-0', className)}>
      <h2 className="mb-3">{titre}</h2>
      <p>{description}</p>
      <ButtonWithLink
        href="https://cloud.contact.ademe.fr/inscription-tete"
        external
        size="big"
      >
        S'inscrire
      </ButtonWithLink>
    </Section>
  );
};

export default Newsletter;
