import {fetchCollection} from 'src/strapi/strapi';
import {
  BeneficesData,
  BeneficesFetchedData,
  IntroductionData,
  IntroductionFetchedData,
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
            case 'services.benefices':
              return {
                type: 'benefices',
                liste: (c as BeneficesFetchedData).benefices_liste.map(b => ({
                  id: b.id,
                  legende: b.legende,
                  image: b.image.data,
                })),
              } as BeneficesData;
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
