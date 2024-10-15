import { StrapiImage } from '@tet/site/components/strapiImage/StrapiImage';
import Section from '@tet/site/components/sections/Section';
import { getLocalDateString } from '@tet/site/src/utils/getLocalDateString';
import ParagrapheArticle from './ParagrapheArticle';
import InfoArticle from './InfoArticle';
import { GallerieArticleData, ImageArticleData } from '../../../types';
import { getData, getMetaData } from './utils';
import GallerieArticle from './GallerieArticle';
import EmbededVideo from '@tet/site/components/video/EmbededVideo';
import { ParagrapheCustomArticleData } from '@tet/site/app/types';
import { Metadata, ResolvingMetadata } from 'next';
import { getUpdatedMetadata } from '@tet/site/src/utils/getUpdatedMetadata';
import { notFound } from 'next/navigation';

export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const data = await getMetaData(parseInt(params.id));
  const metadata = (await parent) as Metadata;

  const newMetaData = getUpdatedMetadata(metadata, {
    title: data.title ?? 'Actualités',
    networkTitle: data.title,
    description: data.description,
    image: data.image,
  });

  return {
    ...newMetaData,
    openGraph: {
      ...newMetaData.openGraph,
      type: 'article',
      publishedTime: data.publishedAt,
      modifiedTime: data.updatedAt,
    },
  };
}

const Article = async ({ params }: { params: { id: string } }) => {
  const id = parseInt(params.id);
  const data = await getData(id);

  if (!data) return notFound();

  return (
    <>
      <Section className="gap-8">
        {/* Image de couverture */}
        <div className="max-h-[550px] w-full overflow-hidden relative">
          <StrapiImage
            data={data.couverture}
            className="object-cover object-center h-full w-full"
            containerClassName="object-cover object-center h-full w-full"
          />
          {(data.couverture.attributes.caption as unknown as string) && (
            <div className="text-right text-grey-1 text-[14px] leading-4 py-1 px-2 absolute right-0 top-[526px] bg-grey-8/50 rounded-tl-sm">
              {data.couverture.attributes.caption as unknown as string}
            </div>
          )}
        </div>

        <div>
          {/* Titre */}
          <h1>{data.titre}</h1>

          {/* Date de création et date d'édition */}
          <p className="text-sm text-[#666]">
            Le {getLocalDateString(data.dateCreation)}
            {data.dateEdition &&
            getLocalDateString(data.dateCreation) !==
              getLocalDateString(data.dateEdition) ? (
              <span>
                {' '}
                &bull; Mis à jour le {getLocalDateString(data.dateEdition)}
              </span>
            ) : (
              ''
            )}
          </p>
        </div>
      </Section>

      {/* Contenu de l'article */}
      {data.contenu.map((section, index) => (
        <Section
          key={index}
          containerClassName={index === 0 ? '!pt-0 !pb-6' : '!py-6'}
          className="article"
        >
          {
            // Contenu de type parapraphe (titre, texte, image)
            section.type === 'paragraphe' ? (
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
              <EmbededVideo
                url={section.data as string}
                className="mb-6 lg:w-4/5"
              />
            ) : // Contenu de type info (dans un cadre bleu)
            section.type === 'info' ? (
              <InfoArticle texte={section.data as string} />
            ) : (
              <></>
            )
          }
        </Section>
      ))}

      <Section className="!flex-row flex-wrap justify-between gap-y-14">
        {!!data.prevId && (
          <a
            className="fr-link fr-icon-arrow-left-line fr-link--icon-left order-1"
            href={`/actus/${data.prevId}`}
          >
            Précédent
          </a>
        )}
        <a
          className="fr-link mx-auto max-[455px]:order-last order-2"
          href="/actus"
        >
          Retour à la liste des articles
        </a>
        {!!data.nextId && (
          <a
            className="fr-link fr-icon-arrow-right-line fr-link--icon-right order-3"
            href={`/actus/${data.nextId}`}
          >
            Suivant
          </a>
        )}
      </Section>
    </>
  );
};

export default Article;
