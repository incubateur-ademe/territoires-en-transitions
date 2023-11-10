import {fetchCollection, fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {sortByRank} from 'src/utils/sortByRank';
import {Content} from './types';

export const getStrapiData = async () => {
  // Fetch de la liste des objectifs
  const objectifs = await fetchCollection('objectifs');

  const formattedObjectifs: Content[] | null = objectifs
    ? sortByRank(objectifs).map(d => ({
        id: d.id,
        description: d.attributes.Description as unknown as string,
        image: d.attributes.Pictogramme.data as unknown as StrapiItem,
      }))
    : null;

  // Fetch de la liste des services
  const services = await fetchCollection('services');

  const formattedServices: Content[] | null = services
    ? sortByRank(services).map(d => ({
        id: d.id,
        titre: d.attributes.Titre as unknown as string,
        description:
          (d.attributes.Description as unknown as string) ?? undefined,
        image: (d.attributes.Image?.data as unknown as StrapiItem) ?? undefined,
        href: (d.attributes.URL as unknown as string) ?? undefined,
      }))
    : null;

  // Fetch de la liste des bénéfices
  const benefices = await fetchCollection('benefices');

  const formattedBenefices: Content[] | null = benefices
    ? sortByRank(benefices).map(d => ({
        id: d.id,
        titre: d.attributes.Titre as unknown as string,
        description: d.attributes.Contenu as unknown as string,
      }))
    : null;

  // Fetch de la liste des étapes
  const etapes = await fetchCollection('etapes');

  const formattedEtapes: Content[] | null = etapes
    ? sortByRank(etapes).map(d => ({
        id: d.id,
        titre: d.attributes.Titre as unknown as string,
        description: d.attributes.Contenu as unknown as string,
      }))
    : null;

  // Fetch du contenu de la page programme
  const data = await fetchSingle('page-programme', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'Objectifs'],
    ['populate[3]', 'Services'],
    ['populate[4]', 'Compte'],
    ['populate[5]', 'Benefices'],
    ['populate[6]', 'Etapes'],
    ['populate[7]', 'Ressources'],
  ]);

  // Formattage de la data
  if (data) {
    const metaImage =
      (data.attributes.seo?.metaImage?.data as unknown as StrapiItem)
        ?.attributes ?? undefined;

    return {
      seo: {
        metaTitle:
          (data.attributes.seo?.metaTitle as unknown as string) ?? undefined,
        metaDescription:
          (data.attributes.seo?.metaDescription as unknown as string) ??
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
      },
      titre: data.attributes.Titre as unknown as string,
      description:
        (data.attributes.Description as unknown as string) ?? undefined,
      couvertureURL:
        (data.attributes.VideoURL as unknown as string) ?? undefined,
      objectifs: {
        titre: data.attributes.Objectifs.Titre as unknown as string,
        description: data.attributes.Objectifs.Description as unknown as string,
        contenu: formattedObjectifs,
      },
      services: {
        titre: data.attributes.Services.Titre as unknown as string,
        description: data.attributes.Services.Description as unknown as string,
        contenu: formattedServices,
      },
      compte: {
        description: data.attributes.Compte.Description as unknown as string,
      },
      benefices: {
        titre: data.attributes.Benefices.Titre as unknown as string,
        description: data.attributes.Benefices.Description as unknown as string,
        contenu: formattedBenefices,
      },
      etapes: {
        titre: data.attributes.Etapes.Titre as unknown as string,
        description: data.attributes.Etapes.Description as unknown as string,
        contenu: formattedEtapes,
      },
      ressources: {
        description: data.attributes.Ressources
          .Description as unknown as string,
        buttons: [
          {
            titre: 'Règlement CAE',
            href: data.attributes.Ressources
              .ReglementCaeURL as unknown as string,
          },
          {
            titre: 'Règlement ECI',
            href: data.attributes.Ressources
              .ReglementEciURL as unknown as string,
          },
          {
            titre: 'Annuaire des conseillers',
            href: data.attributes.Ressources.AnnuaireURL as unknown as string,
          },
        ],
      },
    };
  } else return null;
};
