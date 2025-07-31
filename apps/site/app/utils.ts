import { VignetteAvecDetailsFetchedData } from '@/site/app/types';
import { fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export const getMetaData = async () => {
  const data = await fetchSingle('page-accueil', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'couverture_desktop'],
  ]);

  const metaImage =
    (data?.attributes?.seo?.metaImage?.data as unknown as StrapiItem)
      ?.attributes ??
    (data?.attributes.couverture_desktop.data as unknown as StrapiItem)
      ?.attributes ??
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

export const getData = async () => {
  // Fetch du contenu de la page d'accueil
  const data = await fetchSingle('page-accueil', [
    ['populate[1]', 'couverture_desktop'],
    ['populate[2]', 'couverture_mobile'],
    ['populate[3]', 'programme.image'],
    ['populate[4]', 'plateforme.image'],
    ['populate[5]', 'objectifs_liste_detaillee.image'],
    ['populate[6]', 'objectifs_liste_detaillee.details_cta'],
    ['populate[7]', 'temoignages_liste.temoignage'],
    ['populate[8]', 'temoignages_liste.temoignage.portrait'],
  ]);

  const accueilData = data.attributes;

  const temoignages = data?.attributes.temoignages_liste
    .data as unknown as StrapiItem[];

  // Formattage de la data
  const formattedData = data
    ? {
        banner: {
          couverture: accueilData.couverture_desktop
            ?.data as unknown as StrapiItem,
          couvertureMobile: accueilData.couverture_mobile
            ?.data as unknown as StrapiItem,
        },
        accompagnement: {
          titre: accueilData.accueil_titre as unknown as string,
          description: accueilData.accueil_description as unknown as string,
          contenu: [
            {
              titre: accueilData.programme.titre as unknown as string,
              description: accueilData.programme.legende as unknown as string,
              image: accueilData.programme.image.data as unknown as StrapiItem,
              button: {
                titre: accueilData.programme.cta as unknown as string,
                href: '/programme',
              },
            },
            {
              titre: accueilData.plateforme.titre as unknown as string,
              description: accueilData.plateforme.legende as unknown as string,
              image: accueilData.plateforme.image.data as unknown as StrapiItem,
              button: {
                titre: accueilData.plateforme.cta as unknown as string,
                href: '/outil-numerique',
              },
            },
          ],
        },
        objectifs: {
          titre: accueilData.objectifs_titre as unknown as string,
          contenu:
            !!accueilData.objectifs_liste_detaillee &&
            accueilData.objectifs_liste_detaillee.length
              ? (
                  accueilData.objectifs_liste_detaillee as unknown as VignetteAvecDetailsFetchedData[]
                ).map((obj) => ({
                  id: obj.id,
                  titre: obj.titre,
                  legende: obj.legende,
                  image: obj.image?.data,
                  details: {
                    titre: obj.details_titre,
                    contenu: obj.details_texte,
                    cta: obj.details_cta,
                  },
                }))
              : null,
        },
        collectivites: {
          titre: accueilData.collectivites_titre as unknown as string,
          cta: accueilData.collectivites_cta as unknown as string,
        },
        contact: {
          description: accueilData.contact_description as unknown as string,
          cta: accueilData.contact_cta as unknown as string,
        },
        temoignages:
          temoignages && temoignages.length > 0
            ? {
                titre: accueilData.temoignages_titre as unknown as string,
                contenu: temoignages.map((d) => ({
                  id: d.id,
                  auteur: d.attributes.temoignage?.auteur as unknown as string,
                  role:
                    (d.attributes.temoignage?.role as unknown as string) ??
                    undefined,
                  temoignage: d.attributes.temoignage
                    ?.temoignage as unknown as string,
                  portrait:
                    (d.attributes.temoignage?.portrait
                      .data as unknown as StrapiItem) ?? undefined,
                })),
              }
            : null,
        newsletter: {
          titre: accueilData.newsletter_titre as unknown as string,
          description: accueilData.newsletter_description as unknown as string,
          ctaLinkedin: accueilData.linkedin_btn as unknown as string,
          ctaNewsletter: accueilData.newsletter_btn as unknown as string,
        },
      }
    : null;

  return formattedData;
};
