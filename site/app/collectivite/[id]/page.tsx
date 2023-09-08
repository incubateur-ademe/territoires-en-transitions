/* eslint-disable react/no-unescaped-entities */
'use server';

import ButtonWithLink from '@components/buttons/ButtonWithLink';
import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import EmbededVideo from '@components/video/EmbededVideo';
import GallerieArticle from 'app/actus/[slug]/GallerieArticle';
import InfoArticle from 'app/actus/[slug]/InfoArticle';
import ParagrapheArticle from 'app/actus/[slug]/ParagrapheArticle';
import {
  CitationCollectiviteData,
  GallerieArticleData,
  ImageArticleData,
  ParagrapheArticleData,
  ParagrapheCustomArticleData,
} from 'app/types';
import ActionsCAE from './ActionsCAE';
import Citation from './Citation';
import Introduction from './Introduction';
import Performance from './Performance';
import {getData} from './utils';

const localData: {
  [key: number]: {
    nom: string;
    active: boolean;
    engage: boolean;
    region: string;
    departement: string;
    type: string;
    population: number;
  };
} = {
  1: {
    nom: 'Grenoble Alpes métropole',
    active: true,
    engage: true,
    region: 'Auvergne-Rhône-Alpes',
    departement: 'Isère',
    type: 'Métropole',
    population: 443000,
  },
  2: {
    nom: 'Grenoble',
    active: true,
    engage: true,
    region: 'Auvergne-Rhône-Alpes',
    departement: 'Isère',
    type: 'Métropole',
    population: 443000,
  },
  3: {
    nom: 'Pénélopie',
    active: true,
    engage: false,
    region: 'Auvergne-Rhône-Alpes',
    departement: 'Isère',
    type: 'Communauté d’agglomération',
    population: 443000,
  },
  4: {
    nom: 'Palavas-les-bains',
    active: false,
    engage: false,
    region: 'Auvergne-Rhône-Alpes',
    departement: 'Isère',
    type: 'Commune',
    population: 3000,
  },
};

const DetailCollectivite = async ({params}: {params: {id: string}}) => {
  const id = parseInt(params.id);
  const collectivite = localData[id];
  const data = await getData(collectivite.nom);

  return (
    <>
      {/* En-tête de la page collectivité */}
      <Section className="flex-col" customBackground="#fff">
        <a
          className="fr-link fr-icon-arrow-left-line fr-link--icon-left w-fit text-[#666] text-sm mb-8"
          href="/"
        >
          Revenir à l'accueil
        </a>
        <h2 className="mb-0">{collectivite.nom}</h2>
        <div className="flex gap-2">
          <span className="fr-tag">{collectivite.region}</span>
          <span className="fr-tag">{collectivite.departement}</span>
          <span className="fr-tag">{collectivite.type}</span>
          <span className="fr-tag">
            {collectivite.population
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}{' '}
            habitants
          </span>
        </div>
        <p className="text-sm">
          Vous êtes membre de cette collectivité ?{' '}
          <a
            className="fr-link ml-2 text-sm"
            href="https://app.territoiresentransitions.fr/auth/signin"
          >
            Se connecter
          </a>
        </p>

        {collectivite.active ? (
          collectivite.engage ? (
            <>
              <p className="text-lg">
                Cette collectivité est{' '}
                <strong>activée sur la plateforme</strong> et{' '}
                <strong>engagée dans le programme</strong> Territoire Engagé
                Transition Écologique.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg">
                Cette collectivité est{' '}
                <strong>activée sur la plateforme</strong> mais{' '}
                <strong>pas encore engagée dans le programme</strong> Territoire
                Engagé Transition Écologique.
              </p>
              <ButtonWithLink href="/programme">
                Je découvre l'offre du programme Territoire Engagé
              </ButtonWithLink>
            </>
          )
        ) : (
          <>
            <p className="text-lg">
              Cette collectivité n'est{' '}
              <strong>
                pas activée sur la plateforme ni engagée dans le programme
              </strong>{' '}
              Territoire Engagé Transition Écologique.
            </p>
            <div className="flex gap-8">
              <ButtonWithLink href="https://app.territoiresentransitions.fr/auth/signup">
                Je suis agent, j’active ma collectivité{' '}
              </ButtonWithLink>
              <ButtonWithLink href="/programme" secondary>
                Je découvre l'offre du programme Territoire Engagé
              </ButtonWithLink>
            </div>
          </>
        )}
      </Section>

      {/* Introduction de la collectivité */}
      {data && data.description && (
        <Introduction description={data.description} logos={data.logos} />
      )}

      {/* Contenu de la page */}
      {data &&
        data.contenu &&
        data.contenu.map((section, index) => (
          <Section
            key={index}
            customBackground="#fff"
            containerClassName={
              index === 0 && !data.description ? '!pt-0 !pb-6' : '!py-6'
            }
            className="article flex-col"
          >
            {section.type === 'performance' ? (
              <Performance data={section.data as ParagrapheArticleData} />
            ) : section.type === 'actionsCAE' ? (
              <ActionsCAE data={section.data as ParagrapheArticleData[]} />
            ) : section.type === 'citation' ? (
              <Citation data={section.data as CitationCollectiviteData} /> // Contenu de type parapraphe (titre, texte, image)
            ) : section.type === 'paragraphe' ? (
              <ParagrapheArticle
                paragraphe={section.data as ParagrapheCustomArticleData}
              />
            ) : // Contenu de type image
            section.type === 'image' ? (
              <StrapiImage
                data={(section.data as ImageArticleData).data}
                containerClassName="max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mx-auto mb-6"
                displayCaption={
                  (section.data as ImageArticleData).legendeVisible
                }
              />
            ) : // Contenu de type gallerie d'images
            section.type === 'gallerie' ? (
              <GallerieArticle data={section.data as GallerieArticleData} />
            ) : // Contenu de type vidéo Youtube ou Dailymotion
            section.type === 'video' ? (
              <EmbededVideo url={section.data as string} className="mb-6" />
            ) : // Contenu de type info (dans un cadre bleu)
            section.type === 'info' ? (
              <InfoArticle texte={section.data as string} />
            ) : (
              <></>
            )}
          </Section>
        ))}
    </>
  );
};

export default DetailCollectivite;
