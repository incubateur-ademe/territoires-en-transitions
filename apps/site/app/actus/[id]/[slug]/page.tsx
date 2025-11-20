import { ParagrapheCustomArticleData } from '@/site/app/types';
import ButtonsList, {
  ButtonsListType,
} from '@/site/components/buttons/ButtonsList';
import Section from '@/site/components/sections/Section';
import { DEPRECATED_StrapiImage } from '@/site/components/strapiImage/StrapiImage';
import EmbededVideo from '@/site/components/video/EmbededVideo';
import { getLocalDateString } from '@/site/src/utils/getLocalDateString';
import { getUpdatedMetadata } from '@/site/src/utils/getUpdatedMetadata';
import { Badge, Button } from '@tet/ui';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { GallerieArticleData, ImageArticleData } from '../../../types';
import GallerieArticle from './GallerieArticle';
import InfoArticle from './InfoArticle';
import ParagrapheArticle from './ParagrapheArticle';
import { getData, getMetaData } from './utils';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const data = await getMetaData(parseInt(id));
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

const Article = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = parseInt((await params).id);
  const data = await getData(id);

  if (!data) return notFound();

  return (
    <>
      {/* Image de couverture */}
      <div className="bg-primary-0 h-fit w-full">
        <DEPRECATED_StrapiImage
          data={data.couverture}
          className="h-full w-full object-cover object-center"
          containerClassName="h-[480px] w-full overflow-hidden 2xl:max-w-[1600px] mx-auto"
          displayCaption
        />
      </div>

      <Section containerClassName="!py-8 mb-6">
        {/* Catégories */}
        {!!data.categories && data.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {data.categories.map((category, idx) => (
              <Badge
                key={`${idx}-${category}`}
                title={category}
                state="info"
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Titre */}
        <h1 className="mb-0">{data.titre}</h1>

        {/* Date de création et date d'édition */}
        <p className="text-sm text-grey-6 mb-0">
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
      </Section>

      {/* Contenu de l'article */}
      <div className="flex flex-col gap-12">
        {data.contenu.map((section, index) => (
          <Section key={index} containerClassName="!py-0" className="article">
            {
              // Contenu de type parapraphe (titre, texte, image)
              section.type === 'paragraphe' ? (
                <ParagrapheArticle
                  paragraphe={section.data as ParagrapheCustomArticleData}
                />
              ) : // Contenu de type image
              section.type === 'image' ? (
                <DEPRECATED_StrapiImage
                  data={(section.data as ImageArticleData).data}
                  className="max-h-[400px]"
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
                  className="lg:w-4/5"
                />
              ) : // Contenu de type liste de boutons
              section.type === 'boutons' ? (
                <ButtonsList
                  boutons={section.data as ButtonsListType}
                  className="mx-auto"
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
      </div>

      <Section className="!flex-row flex-wrap justify-between gap-y-14">
        {!!data.prevId && (
          <Button
            href={`/actus/${data.prevId}`}
            variant="underlined"
            icon="arrow-left-line"
            className="order-1"
          >
            Précédent
          </Button>
        )}
        <Button
          href="/actus"
          variant="underlined"
          className="mx-auto max-sm:order-last order-2"
        >
          Retour à la liste des articles
        </Button>
        {!!data.nextId && (
          <Button
            href={`/actus/${data.nextId}`}
            variant="underlined"
            icon="arrow-right-line"
            iconPosition="right"
            className="order-3"
          >
            Suivant
          </Button>
        )}
      </Section>
    </>
  );
};

export default Article;
