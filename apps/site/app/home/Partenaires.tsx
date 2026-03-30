import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import Image from 'next/image';

export const Partenaires = () => {
  return (
    <Section
      className="flex items-center gap-16"
      containerClassName="bg-primary-0 max-md:!py-6 md:max-lg:!py-12 lg:!py-20"
    >
      <TitreSection>Découvrez nos partenaires institutionnels</TitreSection>
      <div className="mx-auto flex flex-col items-center justify-center gap-12 md:flex-row md:flex-wrap">
        <a
          className="after:hidden flex items-center justify-center"
          href="https://www.ecologie.gouv.fr/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <Image
            src="/partenaires/ministeres-te.svg"
            width={236}
            height={120}
            alt="Logo Ministères Transition écologique, Aménagement du territoire, Transports ville et logement"
          />
        </a>
        <a
          className="after:hidden flex items-center justify-center"
          href="https://beta.gouv.fr/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <Image
            src="/partenaires/logo-betagouvfr.svg"
            width={200}
            height={68}
            alt="Logo beta.gouv.fr"
          />
        </a>
        <a
          className="after:hidden flex items-center justify-center"
          href="https://anct.gouv.fr/"
          target="_blank"
          rel="noreferrer noopener"
        >
          <Image
            src="/partenaires/anct.svg"
            width={240}
            height={88}
            alt="Logo ANCT"
          />
        </a>
      </div>
    </Section>
  );
};
