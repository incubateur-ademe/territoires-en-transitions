import {fetchCollection} from 'src/strapi/strapi';
import {IntroductionData, ServicesFetchedData} from './types';

export const getServiceStrapiData = async (uid: string) => {
  const data = await fetchCollection('services', [
    ['filters[uid]', `${uid}`],
    ['populate[0]', 'contenu'],
    ['populate[1]', 'contenu.image'],
    ['populate[2]', 'contenu.image_titre'],
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
                titre: c.titre,
                imageTitre: c.image_titre ? c.image_titre.data : undefined,
                imageTitreTaille: c.image_titre_taille,
                texte: c.texte,
                image: c.image.data,
              } as IntroductionData;
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
