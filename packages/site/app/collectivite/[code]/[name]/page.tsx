/* eslint-disable react/no-unescaped-entities */
'use server';

import Section from '@components/sections/Section';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import EmbededVideo from '@components/video/EmbededVideo';
import GallerieArticle from 'app/actus/[id]/[slug]/GallerieArticle';
import InfoArticle from 'app/actus/[id]/[slug]/InfoArticle';
import ParagrapheArticle from 'app/actus/[id]/[slug]/ParagrapheArticle';
import {
  CitationCollectiviteData,
  GallerieArticleData,
  ImageArticleData,
  ParagrapheArticleData,
  ParagrapheCustomArticleData,
} from 'app/types';
import {Metadata} from 'next';
import {fetchCollectivite} from '../page';
import ActionsCAE from './ActionsCAE';
import Citation from './Citation';
import CollectiviteHeader from './CollectiviteHeader';
import Introduction from './Introduction';
import Labellisation from './Labellisation';
import Performance from './Performance';
import {getData} from './utils';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Collectivités',
  };
}

const DetailCollectivite = async ({params}: {params: {code: string}}) => {
  const collectiviteData = await fetchCollectivite(params.code);
  const strapiData = await getData(params.code);

  if (!collectiviteData || !collectiviteData.nom) return null;

  return (
    <Section
      containerClassName="bg-primary-1 max-md:!py-0"
      className="max-md:px-0"
    >
      <CollectiviteHeader
        nom={collectiviteData.nom}
        region={collectiviteData.region_name ?? undefined}
        departement={collectiviteData.departement_name ?? undefined}
        type={collectiviteData.type_collectivite ?? undefined}
        population={collectiviteData.population_totale ?? undefined}
        url={strapiData?.url}
        couverture={strapiData?.couverture}
        logo={strapiData?.logo}
      />
    </Section>
  );

  // const data = await getData(params.code);
  // return (
  //   <>
  //     {/* En-tête de la page collectivité */}
  //     <Section containerClassName="!pb-6">
  //       <a
  //         className="fr-link fr-icon-arrow-left-line fr-link--icon-left w-fit text-[#666] text-sm mb-8"
  //         href="/"
  //       >
  //         Revenir à l'accueil
  //       </a>
  //     </Section>
  //     {/* Informations sur la labellisation de la collectivité */}
  //     <Labellisation code={params.code} />
  //     {/* Introduction de la collectivité */}
  //     {data && data.description && (
  //       <Introduction description={data.description} logos={data.logos} />
  //     )}
  //     {/* Contenu de la page */}
  //     {data &&
  //       data.contenu &&
  //       data.contenu.map((section, index) => (
  //         <Section
  //           key={index}
  //           containerClassName={
  //             index === 0 && !data.description ? '!pt-0 !pb-6' : '!py-6'
  //           }
  //           className="article"
  //         >
  //           {section.type === 'performance' ? (
  //             <Performance data={section.data as ParagrapheArticleData} />
  //           ) : section.type === 'actionsCAE' ? (
  //             <ActionsCAE data={section.data as ParagrapheArticleData[]} />
  //           ) : section.type === 'citation' ? (
  //             <Citation data={section.data as CitationCollectiviteData} /> // Contenu de type parapraphe (titre, texte, image)
  //           ) : section.type === 'paragraphe' ? (
  //             <ParagrapheArticle
  //               paragraphe={section.data as ParagrapheCustomArticleData}
  //             />
  //           ) : // Contenu de type image
  //           section.type === 'image' ? (
  //             <StrapiImage
  //               data={(section.data as ImageArticleData).data}
  //               containerClassName="max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mx-auto mb-6"
  //               displayCaption={
  //                 (section.data as ImageArticleData).legendeVisible
  //               }
  //             />
  //           ) : // Contenu de type gallerie d'images
  //           section.type === 'gallerie' ? (
  //             <GallerieArticle data={section.data as GallerieArticleData} />
  //           ) : // Contenu de type vidéo Youtube ou Dailymotion
  //           section.type === 'video' ? (
  //             <EmbededVideo
  //               url={section.data as string}
  //               className="mb-6 lg:w-4/5"
  //             />
  //           ) : // Contenu de type info (dans un cadre bleu)
  //           section.type === 'info' ? (
  //             <InfoArticle texte={section.data as string} />
  //           ) : (
  //             <></>
  //           )}
  //         </Section>
  //       ))}
  //   </>
  // );
};

export default DetailCollectivite;
