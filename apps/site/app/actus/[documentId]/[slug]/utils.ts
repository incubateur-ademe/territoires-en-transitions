import { Actualite, getCategoriesNoms } from '@/site/app/actus/utils';
import {
  ArticleData,
  BoutonsFetchedData,
  GallerieFetchedData,
  ImageFetchedData,
  InfoFetchedData,
  ParagrapheCustomFetchedData,
  SectionArticleData,
  VideoFetchedData,
} from '@/site/app/types';
import { fetchCollection, fetchItem } from '@/site/src/strapi/strapi';

const LIMIT = 50;

/**
 * Les anciennes URLs portaient l'`id` numérique de Strapi 4. En Strapi 5, cet
 * `id` change à chaque publication : il est donc figé une fois pour toutes dans
 * le champ caché `legacy_id` (voir `seedActualiteLegacyIds`, strapi/src/index.ts),
 * qui sert à retrouver le `documentId` pour rediriger.
 */
export const resolveActualiteDocumentId = async (
  param: string
): Promise<{ documentId: string; isLegacyId: boolean } | null> => {
  if (!/^\d+$/.test(param)) return { documentId: param, isLegacyId: false };

  const { data } = await fetchCollection<Pick<Actualite, 'Titre'>>(
    'actualites',
    [
      ['filters[legacy_id][$eq]', param],
      ['fields[0]', 'Titre'],
    ]
  );
  const documentId = data?.[0]?.documentId;

  return documentId ? { documentId, isLegacyId: true } : null;
};

export const getTitre = async (documentId: string) => {
  const data = await fetchItem<Pick<Actualite, 'Titre'>>(
    'actualites',
    documentId,
    [['fields[0]', 'Titre']]
  );
  return data?.Titre ?? null;
};

export const getMetaData = async (documentId: string) => {
  const data = await fetchItem<Actualite>('actualites', documentId, [
    ['populate[Couverture]', 'true'],
    ['populate[seo][populate]', 'metaImage'],
  ]);

  if (!data) return null;

  const {
    seo,
    DateCreation: dateCreation,
    createdAt,
    updatedAt,
    Couverture: couverture,
    Titre: titre,
    Resume: resume,
  } = data;

  const image = seo?.metaImage ?? couverture;

  return {
    title: seo?.metaTitle ?? titre,
    description: seo?.metaDescription ?? resume ?? undefined,
    image: image
      ? {
          url: image.url,
          width: image.width ?? 0,
          height: image.height ?? 0,
          type: image.mime,
          alt: image.alternativeText ?? '',
        }
      : undefined,
    publishedAt: dateCreation ?? createdAt,
    updatedAt,
  };
};

type ActualiteTri = Pick<Actualite, 'DateCreation' | 'Epingle'>;

const sortParams = (start: number): [string, string][] => [
  ['fields[0]', 'DateCreation'],
  ['fields[1]', 'createdAt'],
  ['fields[2]', 'Epingle'],
  ['sort[0]', 'Epingle:desc'],
  ['sort[1]', 'createdAt:desc'],
  ['pagination[start]', `${start}`],
  ['pagination[limit]', `${LIMIT}`],
];

const formatSection = (
  section: NonNullable<Actualite['Sections']>[number]
): SectionArticleData => {
  switch (section.__component) {
    case 'contenu.paragraphe': {
      const paragraphe = section as ParagrapheCustomFetchedData;
      return {
        type: 'paragraphe',
        data: {
          titre: paragraphe.Titre,
          texte: paragraphe.Texte,
          image: paragraphe.Image,
          alignementImage: paragraphe.AlignementImage,
          legendeVisible: paragraphe.LegendeVisible,
        },
      };
    }
    case 'contenu.image': {
      const image = section as ImageFetchedData;
      return {
        type: 'image',
        data: {
          data: image.Image,
          legendeVisible: image.LegendeVisible,
        },
      };
    }
    case 'contenu.gallerie': {
      const gallerie = section as GallerieFetchedData;
      return {
        type: 'gallerie',
        data: {
          data: gallerie.Gallerie,
          colonnes: gallerie.NombreColonnes,
          legende: gallerie.Legende,
          legendeVisible: gallerie.LegendeVisible,
        },
      };
    }
    case 'contenu.video': {
      const video = section as VideoFetchedData;
      return { type: 'video', data: video.URL };
    }
    case 'contenu.bouton-groupe': {
      const listeBoutons = section as BoutonsFetchedData;
      return { type: 'boutons', data: listeBoutons.boutons };
    }
    case 'contenu.info': {
      const info = section as InfoFetchedData;
      return { type: 'info', data: info.Texte };
    }
    default:
      return { type: 'paragraphe', data: {} };
  }
};

export const getData = async (
  documentId: string
): Promise<ArticleData | null> => {
  const data = await fetchItem<Actualite>('actualites', documentId, [
    ['populate[Couverture]', 'true'],
    ['populate[categories]', 'true'],
    ['populate[Sections][on][contenu.paragraphe][populate]', 'Image'],
    ['populate[Sections][on][contenu.image][populate]', 'Image'],
    ['populate[Sections][on][contenu.gallerie][populate]', 'Gallerie'],
    ['populate[Sections][on][contenu.bouton-groupe][populate]', 'boutons'],
    ['populate[Sections][on][contenu.video]', 'true'],
    ['populate[Sections][on][contenu.info]', 'true'],
  ]);

  if (!data) return null;

  // Liste complète (triée comme la page de liste) pour situer l'article
  // et en déduire le précédent et le suivant.
  const { data: firstPage, meta } = await fetchCollection<ActualiteTri>(
    'actualites',
    sortParams(0)
  );
  const idList = [...(firstPage ?? [])];
  let page = 1;

  while (page < Math.ceil(meta.pagination.total / LIMIT)) {
    const { data: nextPage } = await fetchCollection<ActualiteTri>(
      'actualites',
      sortParams(page * LIMIT)
    );
    idList.push(...(nextPage ?? []));
    page++;
  }

  const sortedIds = idList
    .map((d) => ({
      documentId: d.documentId,
      epingle: d.Epingle ?? false,
      dateCreation: new Date(d.DateCreation ?? d.createdAt),
    }))
    .sort((a, b) => {
      if (a.epingle && !b.epingle) return -1;
      if (!a.epingle && b.epingle) return 1;

      return b.dateCreation.getTime() - a.dateCreation.getTime();
    });

  const idPosition = sortedIds.findIndex((el) => el.documentId === documentId);
  const prevDocumentId =
    idPosition > 0 ? sortedIds[idPosition - 1].documentId : null;
  const nextDocumentId =
    idPosition !== -1 && idPosition < sortedIds.length - 1
      ? sortedIds[idPosition + 1].documentId
      : null;

  const {
    DateCreation: dateCreation,
    createdAt,
    updatedAt,
    Couverture: couverture,
    Titre: titre,
    categories,
    Sections: sections,
  } = data;

  return {
    titre,
    dateCreation: new Date(dateCreation ?? createdAt),
    dateEdition: new Date(updatedAt),
    couverture,
    categories: getCategoriesNoms(categories),
    contenu: (sections ?? []).map(formatSection),
    prevDocumentId,
    nextDocumentId,
  };
};
