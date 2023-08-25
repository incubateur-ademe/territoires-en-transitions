import {notFound} from 'next/navigation';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {StrapiImage} from '@components/strapiImage/StrapiImage';
import Section from '@components/sections/Section';
import {getLocalDateString} from 'src/utils/getLocalDateString';
import ParagrapheArticle from './ParagrapheArticle';
import InfoArticle from './InfoArticle';
import {
  GallerieArticleData,
  ImageArticleData,
  ParagrapheArticleData,
} from './types';
import {getData} from './utils';
import GallerieArticle from './GallerieArticle';
import EmbededVideo from '@components/video/EmbededVideo';
import './style.css';

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
          className="article"
        >
          {
            // Contenu de type parapraphe (titre, texte, image)
            section.type === 'paragraphe' ? (
              <ParagrapheArticle
                paragraphe={section.data as ParagrapheArticleData}
              />
            ) : // Contenu de type image
            section.type === 'image' ? (
              <picture className="max-w-full lg:max-w-[80%] h-full flex flex-col justify-center items-center mx-auto mb-6">
                <StrapiImage data={(section.data as ImageArticleData).data} />
                {(section.data as ImageArticleData).legende && (
                  <span className="!text-sm text-[#666] mt-2">
                    {(section.data as ImageArticleData).legende}
                  </span>
                )}
              </picture>
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
            )
          }
        </Section>
      ))}

      <Section
        customBackground="#fff"
        className="flex-wrap justify-between gap-y-14"
      >
        {data.prevId && (
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
        {data.nextId && (
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
