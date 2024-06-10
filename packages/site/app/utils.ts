import {fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';
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
    (data?.attributes.Couverture.data as unknown as StrapiItem)?.attributes ??
    undefined;

  return data
    ? {
        metaTitle:
          (data?.attributes?.seo?.metaTitle as unknown as string) ?? undefined,
        metaDescription:
          (data?.attributes?.seo?.metaDescription as unknown as string) ??
          (data?.attributes.Titre as unknown as string) ??
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
      }
    : null;
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
    ['populate[10]', 'temoignages_liste.temoignage'],
    ['populate[11]', 'temoignages_liste.temoignage.portrait'],
  ]);

  const temoignages = data?.attributes.temoignages_liste
    .data as unknown as StrapiItem[];

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
                titre: 'Accéder à la plateforme',
                href: 'https://auth.territoiresentransitions.fr/signup',
              },
            },
          ],
        },
        temoignages:
          temoignages && temoignages.length > 0
            ? {
                titre: data.attributes.Temoignages.Titre as unknown as string,
                description: data.attributes.Temoignages
                  .Description as unknown as string,
                contenu: temoignages.map(d => ({
                  id: d.id,
                  auteur: d.attributes.temoignage?.auteur as unknown as string,
                  description:
                    (d.attributes.temoignage?.role as unknown as string) ??
                    undefined,
                  contenu: d.attributes.temoignage
                    ?.temoignage as unknown as string,
                  image:
                    (d.attributes.temoignage?.portrait
                      .data as unknown as StrapiItem) ?? undefined,
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
