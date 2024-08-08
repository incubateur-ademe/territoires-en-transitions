import {
  ParagrapheCustomArticleData,
  ParagrapheCustomFetchedData,
} from 'app/types';
import {fetchCollection, fetchItem} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';
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

  const image =
    (data?.attributes.seo?.metaImage?.data as unknown as StrapiItem)
      ?.attributes ??
    (data?.attributes.Couverture.data as unknown as StrapiItem)?.attributes;

  return {
    title:
      (data?.attributes.seo?.metaTitle as unknown as string) ??
      (data?.attributes.Titre as unknown as string) ??
      undefined,
    description:
      (data?.attributes.seo?.metaDescription as unknown as string) ??
      (data?.attributes.Resume as unknown as string) ??
      undefined,
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
      (data.attributes.DateCreation as unknown as string) ??
      (data.attributes.createdAt as unknown as string),
    updatedAt: data.attributes.updatedAt as unknown as string,
  };
};

export const getData = async (id: number) => {
  const data = await fetchItem('actualites', id, [
    ['populate[0]', 'Couverture'],
    ['populate[1]', 'Sections'],
    ['populate[2]', 'Sections.Image'],
    ['populate[3]', 'Sections.Gallerie'],
  ]);

  if (data) {
    const {data: ids, meta} = await fetchCollection('actualites', [
      ['fields[0]', 'DateCreation'],
      ['fields[1]', 'createdAt'],
      ['fields[2]', 'Epingle'],
      ['sort[0]', 'createdAt:desc'],
      ['pagination[start]', '0'],
      ['pagination[limit]', `${LIMIT}`],
    ]);

    const {pagination} = meta;
    let idList = ids;
    let page = 1;

    while (page < Math.ceil(pagination.total / pagination.limit)) {
      const {data} = await fetchCollection('actualites', [
        ['fields[0]', 'DateCreation'],
        ['fields[1]', 'createdAt'],
        ['fields[2]', 'Epingle'],
        ['sort[0]', 'createdAt:desc'],
        ['pagination[start]', `${page * LIMIT}`],
        ['pagination[limit]', `${LIMIT}`],
      ]);
      idList.push(...data);
      page++;
    }

    const sortedIds = idList
      ? idList
          .map(d => ({
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

    const idPosition = sortedIds ? sortedIds.findIndex(el => el.id === id) : 0;
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

    const formattedData: ArticleData = {
      titre: data.attributes.Titre as unknown as string,
      dateCreation:
        (data.attributes.DateCreation as unknown as Date) ??
        (data.attributes.createdAt as unknown as Date),
      dateEdition: data.attributes.updatedAt as unknown as Date,
      couverture: data.attributes.Couverture.data as unknown as StrapiItem,
      contenu: (
        data.attributes.Sections as unknown as ContenuArticleFetchedData
      ).map(section => {
        if (section.__component === 'contenu.paragraphe') {
          return {
            type: 'paragraphe',
            data: {
              titre: (section as ParagrapheCustomFetchedData).Titre,
              texte: (section as ParagrapheCustomFetchedData).Texte,
              image: (section as ParagrapheCustomFetchedData).Image.data,
              alignementImage: (section as ParagrapheCustomFetchedData)
                .AlignementImage,
              legendeVisible: (section as ParagrapheCustomFetchedData)
                .LegendeVisible,
            } as ParagrapheCustomArticleData,
          };
        } else if (section.__component === 'contenu.image') {
          return {
            type: 'image',
            data: {
              data: (section as ImageFetchedData).Image.data,
              legendeVisible: (section as ImageFetchedData).LegendeVisible,
            },
          };
        } else if (section.__component === 'contenu.gallerie') {
          return {
            type: 'gallerie',
            data: {
              data: (section as GallerieFetchedData).Gallerie.data,
              colonnes: (section as GallerieFetchedData).NombreColonnes,
              legende: (section as GallerieFetchedData).Legende,
              legendeVisible: (section as GallerieFetchedData).LegendeVisible,
            },
          };
        } else if (section.__component === 'contenu.video') {
          return {
            type: 'video',
            data: (section as VideoFetchedData).URL,
          };
        } else if (section.__component === 'contenu.info') {
          return {
            type: 'info',
            data: (section as InfoFetchedData).Texte,
          };
        } else return {type: 'paragraphe', data: {}};
      }),
      prevId,
      nextId,
    };

    return formattedData;
  } else return data;
};
