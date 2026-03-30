import Section from '@/site/components/sections/Section';
import { TitreSection } from '@/site/components/sections/TitreSection';
import EmbededVideo from '@/site/components/video/EmbededVideo';

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
      <TitreSection>{titre}</TitreSection>
      {!!description && (
        <p className="text-2xl text-grey-8 text-center">{description}</p>
      )}
      {!!couvertureURL && (
        <EmbededVideo
          url={couvertureURL}
          title="Découvrez le programme Territoire Engagé Transition Écologique"
          className="xl:w-4/6 lg:w-4/5"
        />
      )}
    </Section>
  );
};

export default ProgrammeBanner;
