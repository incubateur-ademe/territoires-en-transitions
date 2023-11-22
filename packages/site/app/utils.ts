import {fetchCollection, fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {sortByRank} from 'src/utils/sortByRank';
import {AccueilData} from './types';

export const getMetaData = async () => {
  const data = await fetchSingle('page-accueil', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'Couverture'],
  ]);

  const metaImage =
    (data?.attributes?.seo?.metaImage?.data as unknown as StrapiItem)
      ?.attributes ??
    (data.attributes.Couverture.data as unknown as StrapiItem)?.attributes ??
    undefined;

  return {
    metaTitle:
      (data?.attributes?.seo?.metaTitle as unknown as string) ?? undefined,
    metaDescription:
      (data?.attributes?.seo?.metaDescription as unknown as string) ??
      (data.attributes.Titre as unknown as string) ??
      undefined,
    metaImage: metaImage
      ? {
          url: metaImage.url as unknown as string,
          width: metaImage.width as unknown as number,
          height: metaImage.height as unknown as number,
          type: metaImage.mime as unknown as string,
          alt: metaImage.alternativeText as unknown as string,
        }
      : undefined,
  };
};

export const getData = async (): Promise<AccueilData | null> => {
  // Fetch du contenu de la page d'accueil
  const data = await fetchSingle('page-accueil', [
    ['populate[0]', 'Titre'],
    ['populate[1]', 'Couverture'],
    ['populate[2]', 'Accompagnement'],
    ['populate[3]', 'Accompagnement.Programme'],
    ['populate[4]', 'Accompagnement.Programme.Image'],
    ['populate[5]', 'Accompagnement.Compte'],
    ['populate[6]', 'Accompagnement.Compte.Image'],
    ['populate[7]', 'Temoignages'],
    ['populate[8]', 'Informations'],
    ['populate[9]', 'Newsletter'],
  ]);

  // Fetch de la liste des témoignages
  const temoignages = await fetchCollection('temoignages', [
    ['populate[0]', 'Image'],
    ['sort[0]', 'Rang:asc'],
  ]);

  // Formattage de la data
  const formattedData: AccueilData | null = data
    ? {
        titre: data.attributes.Titre as unknown as string,
        couverture:
          (data.attributes.Couverture.data as unknown as StrapiItem) ??
          undefined,
        accompagnement: {
          titre: data.attributes.Accompagnement.Titre as unknown as string,
          description: data.attributes.Accompagnement
            .Description as unknown as string,
          contenu: [
            {
              titre: data.attributes.Accompagnement.Programme
                .Titre as unknown as string,
              description: data.attributes.Accompagnement.Programme
                .Description as unknown as string,
              image: data.attributes.Accompagnement.Programme.Image
                .data as unknown as StrapiItem,
              button: {titre: 'Découvrir le programme', href: '/programme'},
            },
            {
              titre: data.attributes.Accompagnement.Compte
                .Titre as unknown as string,
              description: data.attributes.Accompagnement.Compte
                .Description as unknown as string,
              image: data.attributes.Accompagnement.Compte.Image
                .data as unknown as StrapiItem,
              button: {
                titre: 'Créer un compte',
                href: 'https://app.territoiresentransitions.fr/auth/signup',
              },
            },
          ],
        },
        temoignages: temoignages
          ? {
              titre: data.attributes.Temoignages.Titre as unknown as string,
              description: data.attributes.Temoignages
                .Description as unknown as string,
              contenu: sortByRank(temoignages).map(d => ({
                id: d.id,
                auteur: d.attributes.Auteur as unknown as string,
                description:
                  (d.attributes.Description as unknown as string) ?? undefined,
                contenu: d.attributes.Contenu as unknown as string,
                image:
                  (d.attributes.Image.data as unknown as StrapiItem) ??
                  undefined,
              })),
            }
          : null,
        informations: {
          titre: data.attributes.Informations.Titre as unknown as string,
          description: data.attributes.Informations
            .Description as unknown as string,
        },
        newsletter: {
          titre: data.attributes.Newsletter.Titre as unknown as string,
          description: data.attributes.Newsletter
            .Description as unknown as string,
        },
      }
    : null;

  return formattedData;
};
