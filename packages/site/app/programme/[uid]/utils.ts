import {fetchCollection} from 'src/strapi/strapi';
import {
  BeneficesData,
  BeneficesFetchedData,
  IntroductionData,
  IntroductionFetchedData,
  ListeCartesData,
  ListeCartesFetchedData,
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
    ['populate[1]', 'contenu.image'],
    ['populate[2]', 'contenu.image_titre'],
    ['populate[3]', 'contenu.benefices_liste'],
    ['populate[4]', 'contenu.benefices_liste.image'],
    ['populate[5]', 'contenu.images'],
    ['populate[6]', 'contenu.contenu'],
    ['populate[7]', 'contenu.contenu.image'],
    ['populate[8]', 'contenu.liste'],
    ['populate[9]', 'contenu.liste.image'],
  ]);

  if (data) {
    const serviceData = data[0].attributes;

    return {
      titre: serviceData.titre,
      contenu: (serviceData.contenu as unknown as ServicesFetchedData)
        .map(c => {
          switch (c.__component) {
            case 'services.introduction':
              return {
                type: 'introduction',
                titre: (c as IntroductionFetchedData).titre,
                imageTitre: (c as IntroductionFetchedData).image_titre?.data,
                imageTitreTaille: (c as IntroductionFetchedData)
                  .image_titre_taille,
                texte: (c as IntroductionFetchedData).texte,
                image: (c as IntroductionFetchedData).image.data,
              } as IntroductionData;
            case 'services.paragraphe':
              return {
                type: 'paragraphe',
                titre: (c as ParagrapheFetchedData).titre,
                imageTitre: (c as ParagrapheFetchedData).image_titre?.data,
                imageTitreTaille: (c as ParagrapheFetchedData)
                  .image_titre_taille,
                texte: (c as ParagrapheFetchedData).texte,
                images: (c as ParagrapheFetchedData).images?.data,
                alignementImageDroite: (c as ParagrapheFetchedData)
                  .alignement_image_droite,
              } as ParagrapheData;
            case 'services.benefices':
              return {
                type: 'benefices',
                liste: (c as BeneficesFetchedData).benefices_liste.map(b => ({
                  id: b.id,
                  legende: b.legende,
                  image: b.image.data,
                })),
              } as BeneficesData;
            case 'services.liste':
              return {
                type: 'liste',
                titre: (c as ListeFetchedData).titre,
                sousTitre: (c as ListeFetchedData).sous_titre,
                introduction: (c as ListeFetchedData).introduction,
                contenu: (c as ListeFetchedData).contenu.map(ct => ({
                  id: ct.id,
                  titre: ct.titre,
                  legende: ct.legende,
                  image: ct.image.data,
                })),
              } as ListeData;
            case 'services.liste-cartes':
              return {
                type: 'listeCartes',
                titre: (c as ListeCartesFetchedData).titre,
                introduction: (c as ListeCartesFetchedData).introduction,
                liste: (c as ListeCartesFetchedData).liste.map(ct => ({
                  id: ct.id,
                  preTitre: ct.pre_titre,
                  titre: ct.titre,
                  texte: ct.texte,
                  image: ct.image.data,
                })),
              } as ListeCartesData;
            default:
              return {
                type: 'autre',
              };
          }
        })
        .filter(c => c.type !== 'autre'),
    };
  } else return data;
};
