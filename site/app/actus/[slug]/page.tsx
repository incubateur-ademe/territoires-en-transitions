import {notFound} from 'next/navigation';
import {StrapiItem} from 'src/StrapiItem';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import Section from '@components/sections/Section';
import {getLocalDateString} from 'src/utils/getLocalDateString';
import ParagrapheArticle from './ParagrapheArticle';
import InfoArticle from './InfoArticle';
import {ParagrapheArticleData} from './types';
import {getData} from './utils';
import GallerieArticle from './GallerieArticle';
import EmbededVideo from '@components/video/EmbededVideo';

const Article = async ({params}: {params: {slug: string}}) => {
  const id = parseInt(params.slug);
  const data = await getData(id);

  if (!data) return notFound();

  return (
    <>
      <Section className="flex-col gap-8">
        {/* Image de couverture */}
        <StrapiImage
          data={data.couverture}
          className="fr-responsive-img max-h-[550px] object-cover"
        />

        <div>
          {/* Titre */}
          <h2>{data.titre}</h2>

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
          customBackground="#fff"
          containerClassName={index === 0 ? '!pt-0 !pb-6' : '!py-6'}
        >
          {
            // Contenu de type parapraphe (titre, texte, image)
            section.type === 'paragraphe' ? (
              <ParagrapheArticle
                paragraphe={section.data as ParagrapheArticleData}
              />
            ) : // Contenu de type image
            section.type === 'image' ? (
              <picture className="w-full h-full flex justify-center items-center">
                <StrapiImage data={section.data as StrapiItem} />
              </picture>
            ) : // Contenu de type gallerie d'images
            section.type === 'gallerie' ? (
              <GallerieArticle images={section.data as StrapiItem[]} />
            ) : // Contenu de type vidéo Youtube ou Dailymotion
            section.type === 'video' ? (
              <EmbededVideo url={section.data as string} />
            ) : // Contenu de type info (dans un cadre bleu)
            section.type === 'info' ? (
              <InfoArticle texte={section.data as string} />
            ) : (
              <></>
            )
          }
        </Section>
      ))}
    </>
  );
};

export default Article;
