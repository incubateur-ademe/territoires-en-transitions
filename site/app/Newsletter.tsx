/* eslint-disable react/no-unescaped-entities */
import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';

type NewsletterProps = {
  titre: string;
  description?: string;
};

const Newsletter = ({titre, description}: NewsletterProps) => {
  return (
    <Section className="flex-col gap-0">
      <h3 className="mb-3">{titre}</h3>
      <p>{description}</p>
      <ButtonWithLink href="/inscription">S'inscrire</ButtonWithLink>
    </Section>
  );
};

export default Newsletter;
