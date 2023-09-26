/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';

type NewsletterProps = {
  titre: string;
  description?: string;
};

const Newsletter = ({titre, description}: NewsletterProps) => {
  return (
    <Section className="gap-0">
      <h2 className="mb-3">{titre}</h2>
      <p>{description}</p>
      <ButtonWithLink
        href="https://cloud.contact.ademe.fr/inscription-tete"
        external
        rounded
      >
        S'inscrire
      </ButtonWithLink>
    </Section>
  );
};

export default Newsletter;
