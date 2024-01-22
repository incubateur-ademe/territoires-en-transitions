import {fetchCollection} from 'src/strapi/strapi';
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
  const data = await fetchCollection('services', [
    ['filters[uid]', `${uid}`],
    ['populate[0]', 'contenu'],
    ['populate[1]', 'contenu.image_titre'],
    ['populate[2]', 'contenu.images'],
    ['populate[3]', 'contenu.liste'],
    ['populate[4]', 'contenu.liste.image'],
    ['populate[5]', 'contenu.boutons'],
  ]);

  if (data && data.length > 0 && data[0].attributes.contenu) {
    const serviceData = data[0].attributes;

    return {
      titre: serviceData.titre,
      contenu: (serviceData.contenu as unknown as ServicesFetchedData).map(
        c => {
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
              liste: listeData.liste.map(ct => ({
                id: ct.id,
                preTitre: ct.pre_titre,
                titre: ct.titre,
                texte: ct.texte,
                image: ct.image?.data,
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
        },
      ),
    };
  } else return null;
};
