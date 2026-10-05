import { fetchCollection } from '@/site/src/strapi/strapi';
import { Bouton } from '@/site/src/strapi/types';
import { buildSeoImage } from '../utils';
import { Service, ServiceSection } from './types';

const toButtonsList = (boutons: Bouton[]) =>
  boutons.map(({ id, label, url }) => ({ id, label, url: url ?? undefined }));

export const getServiceStrapiData = async (uid: string) => {
  // `contenu` est une dynamic zone : chaque composant à recevoir doit avoir sa
  // clé `on`, la notation pointée `contenu.liste.image` n'est plus acceptée.
  const { data } = await fetchCollection<Service>('services', [
    ['filters[uid]', uid],
    ['populate[seo][populate]', 'metaImage'],
    ['populate[contenu][on][services.paragraphe][populate][0]', 'image_titre'],
    ['populate[contenu][on][services.paragraphe][populate][1]', 'images'],
    [
      'populate[contenu][on][services.liste][populate][liste][populate][0]',
      'image',
    ],
    [
      'populate[contenu][on][services.liste][populate][liste][populate][1]',
      'boutons',
    ],
    ['populate[contenu][on][services.info][populate]', 'boutons'],
  ]);

  const service = data?.[0];
  if (!service?.contenu) return null;

  return {
    seo: {
      metaTitle: service.seo?.metaTitle ?? undefined,
      metaDescription: service.seo?.metaDescription ?? undefined,
      metaImage: buildSeoImage(service.seo?.metaImage),
    },
    titre: service.titre,
    contenu: service.contenu.map((c): ServiceSection => {
      switch (c.__component) {
        case 'services.paragraphe':
          return {
            type: 'paragraphe',
            tailleParagraphe: c.taille_paragraphe,
            titre: c.titre,
            titreCentre: c.titre_centre,
            imageTitre: c.image_titre,
            tailleImageTitre: c.taille_image_titre,
            sousTitre: c.sous_titre,
            texte: c.texte,
            images: c.images,
            alignementImageDroite: c.alignement_image_droite,
          };
        case 'services.liste':
          return {
            type: 'liste',
            tailleListe: c.taille_liste,
            titre: c.titre,
            sousTitre: c.sous_titre,
            introduction: c.introduction,
            liste: c.liste.map((carte) => ({
              id: carte.id,
              preTitre: carte.pre_titre,
              titre: carte.titre,
              texte: carte.texte,
              image: carte.image,
              boutons: toButtonsList(carte.boutons),
            })),
            dispositionCartes: c.disposition_cartes,
          };
        case 'services.info':
          return {
            type: 'info',
            titre: c.titre,
            boutons: toButtonsList(c.boutons),
          };
      }
    }),
  };
};
