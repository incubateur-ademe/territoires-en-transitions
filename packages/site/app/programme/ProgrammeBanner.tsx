/* eslint-disable react/no-unescaped-entities */
import Section from '@tet/site/components/sections/Section';
import EmbededVideo from '@tet/site/components/video/EmbededVideo';
import Objectifs from './Objectifs';
import { Content } from './types';

type ProgrammeBannerProps = {
  titre: string;
  description?: string;
  couvertureURL?: string;
  objectifs: {
    titre: string;
    description?: string;
    contenu: Content[] | null;
  };
};

const ProgrammeBanner = ({
  titre,
  description,
  couvertureURL,
  objectifs,
}: ProgrammeBannerProps) => {
  return (
    <Section>
      <h1 className="text-center">{titre}</h1>
      {!!description && (
        <p className="text-[1.375rem] text-grey-8 text-center">{description}</p>
      )}
      {!!couvertureURL && (
        <EmbededVideo
          url={couvertureURL}
          title="Découvrez le programme Territoire Engagé Transition Écologique"
          className="xl:w-4/6 lg:w-4/5"
        />
      )}
      <Objectifs
        titre={objectifs.titre}
        description={objectifs.description}
        contenu={objectifs.contenu}
      />
    </Section>
  );
};

export default ProgrammeBanner;
