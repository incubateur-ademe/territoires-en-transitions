import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { fetchCollection } from '@/site/src/strapi/strapi';
import {
  InfoData,
  InfoFetchedData,
  ListeData,
  ListeFetchedData,
  ParagrapheData,
  ParagrapheFetchedData,
  ServicesFetchedData,
} from './types';

export const getServiceStrapiData = async (uid: string) => {
  const { data } = await fetchCollection('services', [
    ['filters[uid]', `${uid}`],
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'contenu'],
    ['populate[3]', 'contenu.image_titre'],
    ['populate[4]', 'contenu.images'],
    ['populate[5]', 'contenu.liste'],
    ['populate[6]', 'contenu.liste.image'],
    ['populate[7]', 'contenu.liste.boutons'],
    ['populate[8]', 'contenu.boutons'],
  ]);

  if (data && data.length > 0 && data[0].attributes.contenu) {
    const serviceData = data[0].attributes;

    const metaImage =
      (serviceData.seo?.metaImage?.data as unknown as StrapiItem)?.attributes ??
      undefined;

    return {
      seo: {
        metaTitle:
          (serviceData.seo?.metaTitle as unknown as string) ?? undefined,
        metaDescription:
          (serviceData.seo?.metaDescription as unknown as string) ?? undefined,
        metaImage: metaImage
          ? {
              url: metaImage.url as unknown as string,
              width: metaImage.width as unknown as number,
              height: metaImage.height as unknown as number,
              type: metaImage.mime as unknown as string,
              alt: metaImage.alternativeText as unknown as string,
            }
          : undefined,
      },
      titre: serviceData.titre,
      contenu: (serviceData.contenu as unknown as ServicesFetchedData).map(
        (c) => {
          if (c.__component === 'services.paragraphe') {
            const paragrapheData = c as ParagrapheFetchedData;
            return {
              type: 'paragraphe',
              tailleParagraphe: paragrapheData.taille_paragraphe,
              titre: paragrapheData.titre,
              titreCentre: paragrapheData.titre_centre,
              imageTitre: paragrapheData.image_titre?.data,
              tailleImageTitre: paragrapheData.taille_image_titre,
              sousTitre: paragrapheData.sous_titre,
              texte: paragrapheData.texte,
              images: paragrapheData.images?.data,
              alignementImageDroite: paragrapheData.alignement_image_droite,
            } as ParagrapheData;
          } else if (c.__component === 'services.liste') {
            const listeData = c as ListeFetchedData;
            return {
              type: 'liste',
              tailleListe: listeData.taille_liste,
              titre: listeData.titre,
              sousTitre: listeData.sous_titre,
              introduction: listeData.introduction,
              liste: listeData.liste.map((ct) => ({
                id: ct.id,
                icone: ct.icone,
                preTitre: ct.pre_titre,
                titre: ct.titre,
                texte: ct.texte,
                image: ct.image?.data,
                boutons: ct.boutons,
              })),
              dispositionCartes: listeData.disposition_cartes,
            } as ListeData;
          } else {
            const infoData = c as InfoFetchedData;
            return {
              type: 'info',
              titre: infoData.titre,
              boutons: infoData.boutons,
            } as InfoData;
          }
        }
      ),
    };
  } else return null;
};
