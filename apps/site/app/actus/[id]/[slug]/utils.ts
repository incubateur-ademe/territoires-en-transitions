import {
  BoutonsArticleData,
  BoutonsFetchedData,
  ParagrapheCustomArticleData,
  ParagrapheCustomFetchedData,
} from '@/site/app/types';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { fetchCollection, fetchItem } from '@/site/src/strapi/strapi';
import {
  ArticleData,
  ContenuArticleFetchedData,
  GallerieFetchedData,
  ImageFetchedData,
  InfoFetchedData,
  VideoFetchedData,
} from '../../../types';

const LIMIT = 50;

export const getMetaData = async (id: number) => {
  const data = await fetchItem('actualites', id, [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'Couverture'],
  ]);

  const article = data.attributes;
  const {
    seo,
    DateCreation: dateCreation,
    createdAt,
    updatedAt,
    Couverture: { data: couverture },
    Titre: titre,
    Resume: resume,
  } = article;

  const image =
    (seo?.metaImage?.data as unknown as StrapiItem)?.attributes ??
    (couverture as unknown as StrapiItem)?.attributes;

  return {
    title:
      (seo?.metaTitle as unknown as string) ?? (titre as unknown as string),
    description:
      (seo?.metaDescription as unknown as string) ??
      (resume as unknown as string),
    image: image
      ? {
          url: image.url as unknown as string,
          width: image.width as unknown as number,
          height: image.height as unknown as number,
          type: image.mime as unknown as string,
          alt: image.alternativeText as unknown as string,
        }
      : undefined,
    publishedAt:
      (dateCreation as unknown as string) ?? (createdAt as unknown as string),
    updatedAt: updatedAt as unknown as string,
  };
};

export const getData = async (id: number) => {
  const data = await fetchItem('actualites', id, [
    ['populate[0]', 'Couverture'],
    ['populate[1]', 'categories'],
    ['populate[2]', 'Sections'],
    ['populate[3]', 'Sections.Image'],
    ['populate[4]', 'Sections.Gallerie'],
    ['populate[5]', 'Sections.boutons'],
  ]);

  if (data) {
    const { data: ids, meta } = await fetchCollection('actualites', [
      ['fields[0]', 'DateCreation'],
      ['fields[1]', 'createdAt'],
      ['fields[2]', 'Epingle'],
      ['sort[0]', 'Epingle:desc'],
      ['sort[1]', 'createdAt:desc'],
      ['pagination[start]', '0'],
      ['pagination[limit]', `${LIMIT}`],
    ]);

    const { pagination } = meta;
    const idList = ids;
    let page = 1;

    while (page < Math.ceil(pagination.total / pagination.limit)) {
      const { data } = await fetchCollection('actualites', [
        ['fields[0]', 'DateCreation'],
        ['fields[1]', 'createdAt'],
        ['fields[2]', 'Epingle'],
        ['sort[0]', 'Epingle:desc'],
        ['sort[1]', 'createdAt:desc'],
        ['pagination[start]', `${page * LIMIT}`],
        ['pagination[limit]', `${LIMIT}`],
      ]);
      idList.push(...data);
      page++;
    }

    const sortedIds = idList
      ? idList
          .map((d) => ({
            id: d.id,
            epingle: (d.attributes.Epingle as unknown as boolean) ?? false,
            dateCreation:
              (d.attributes.DateCreation as unknown as Date) ??
              (d.attributes.createdAt as unknown as Date),
          }))
          .sort((a, b) => {
            if (a.epingle && !b.epingle) return -1;
            if (!a.epingle && b.epingle) return 1;

            return (
              new Date(b.dateCreation).getTime() -
              new Date(a.dateCreation).getTime()
            );
          })
      : null;

    const idPosition = sortedIds
      ? sortedIds.findIndex((el) => el.id === id)
      : 0;
    const prevId = sortedIds
      ? idPosition !== 0
        ? sortedIds[idPosition - 1].id
        : null
      : null;
    const nextId = sortedIds
      ? idPosition !== sortedIds.length - 1
        ? sortedIds[idPosition + 1].id
        : null
      : null;

    const article = data.attributes;
    const {
      DateCreation: dateCreation,
      createdAt,
      updatedAt,
      Couverture: { data: couverture },
      Titre: titre,
      categories,
      Sections: sections,
    } = article;

    const formattedData: ArticleData = {
      titre: titre as unknown as string,
      dateCreation:
        (dateCreation as unknown as Date) ?? (createdAt as unknown as Date),
      dateEdition: updatedAt as unknown as Date,
      couverture: couverture as unknown as StrapiItem,
      categories: ((categories?.data as unknown as StrapiItem[]) ?? []).map(
        (d) => d.attributes.nom as unknown as string
      ),
      contenu: (sections as unknown as ContenuArticleFetchedData).map(
        (section) => {
          switch (section.__component) {
            case 'contenu.paragraphe': {
              const paragraphe = section as ParagrapheCustomFetchedData;
              return {
                type: 'paragraphe',
                data: {
                  titre: paragraphe.Titre,
                  texte: paragraphe.Texte,
                  image: paragraphe.Image.data,
                  alignementImage: paragraphe.AlignementImage,
                  legendeVisible: paragraphe.LegendeVisible,
                } as ParagrapheCustomArticleData,
              };
            }
            case 'contenu.image': {
              const image = section as ImageFetchedData;
              return {
                type: 'image',
                data: {
                  data: image.Image.data,
                  legendeVisible: image.LegendeVisible,
                },
              };
            }
            case 'contenu.gallerie': {
              const gallerie = section as GallerieFetchedData;
              return {
                type: 'gallerie',
                data: {
                  data: gallerie.Gallerie.data,
                  colonnes: gallerie.NombreColonnes,
                  legende: gallerie.Legende,
                  legendeVisible: gallerie.LegendeVisible,
                },
              };
            }
            case 'contenu.video': {
              const video = section as VideoFetchedData;
              return {
                type: 'video',
                data: video.URL,
              };
            }
            case 'contenu.bouton-groupe': {
              const listeBoutons = section as BoutonsFetchedData;
              return {
                type: 'boutons',
                data: listeBoutons.boutons as BoutonsArticleData,
              };
            }
            case 'contenu.info': {
              const info = section as InfoFetchedData;
              return {
                type: 'info',
                data: info.Texte,
              };
            }
            default:
              return { type: 'paragraphe', data: {} };
          }
        }
      ),
      prevId,
      nextId,
    };

    return formattedData;
  } else return data;
};
