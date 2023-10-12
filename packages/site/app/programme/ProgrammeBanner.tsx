/* eslint-disable react/no-unescaped-entities */
import Section from '@components/sections/Section';
import EmbededVideo from '@components/video/EmbededVideo';

type ProgrammeBannerProps = {
  titre: string;
  description?: string;
  couvertureURL?: string;
};

const ProgrammeBanner = ({
  titre,
  description,
  couvertureURL,
}: ProgrammeBannerProps) => {
  return (
    <Section>
      <h1>{titre}</h1>
      {description && <p className="text-[1.375rem]">{description}</p>}
      {couvertureURL && (
        <EmbededVideo
          url={couvertureURL}
          title="Découvrez le programme Territoire Engagé Transition Écologique"
        />
      )}
    </Section>
  );
};

export default ProgrammeBanner;
