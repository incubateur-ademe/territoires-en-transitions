import {fetchCollection, fetchItem} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {
  ArticleData,
  ContenuArticleFetchedData,
  GallerieFetchedData,
  ImageFetchedData,
  InfoFetchedData,
  ParagrapheArticleData,
  ParagrapheFetchedData,
  VideoFetchedData,
} from './types';

export const getData = async (id: number) => {
  const data = await fetchItem('actualites', id, [
    ['populate[0]', 'Couverture'],
    ['populate[1]', 'Sections'],
    ['populate[2]', 'Sections.Image'],
    ['populate[3]', 'Sections.Gallerie'],
  ]);

  if (data) {
    const idList = await fetchCollection('actualites', [
      ['fields[0]', 'DateCreation'],
      ['fields[1]', 'createdAt'],
      ['sort[0]', 'createdAt:desc'],
    ]);

    const sortedIds = idList
      ? idList
          .map(d => ({
            id: d.id,
            dateCreation:
              (d.attributes.DateCreation as unknown as Date) ??
              (d.attributes.createdAt as unknown as Date),
          }))
          .sort(
            (a, b) =>
              new Date(b.dateCreation).getTime() -
              new Date(a.dateCreation).getTime(),
          )
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
              titre: (section as ParagrapheFetchedData).Titre,
              texte: (section as ParagrapheFetchedData).Texte,
              image: (section as ParagrapheFetchedData).Image.data,
              alignementImage: (section as ParagrapheFetchedData)
                .AlignementImage,
            } as ParagrapheArticleData,
          };
        } else if (section.__component === 'contenu.image') {
          return {
            type: 'image',
            data: (section as ImageFetchedData).Image.data,
          };
        } else if (section.__component === 'contenu.gallerie') {
          return {
            type: 'gallerie',
            data: (section as GallerieFetchedData).Gallerie.data,
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
