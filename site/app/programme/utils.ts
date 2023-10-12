import {sortByRank} from 'app/utils';
import {fetchCollection, fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';
import {Content, ProgrammeData} from './types';

export const getData = async () => {
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
        image: (d.attributes.Image.data as unknown as StrapiItem) ?? undefined,
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
  const data = await fetchSingle('programme');

  // Formattage de la data
  const formattedData: ProgrammeData | null = data
    ? {
        titre: data.attributes.Titre as unknown as string,
        description:
          (data.attributes.Description as unknown as string) ?? undefined,
        couvertureURL:
          (data.attributes.VideoURL as unknown as string) ?? undefined,
        objectifs: {
          titre: data.attributes.Objectifs.Titre as unknown as string,
          description: data.attributes.Objectifs
            .Description as unknown as string,
          contenu: formattedObjectifs,
        },
        services: {
          titre: data.attributes.Services.Titre as unknown as string,
          description: data.attributes.Services
            .Description as unknown as string,
          contenu: formattedServices,
        },
        offre: {
          description: data.attributes.Offre.Description as unknown as string,
        },
        benefices: {
          titre: data.attributes.Benefices.Titre as unknown as string,
          description: data.attributes.Benefices
            .Description as unknown as string,
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
      }
    : null;

  return formattedData;
};
