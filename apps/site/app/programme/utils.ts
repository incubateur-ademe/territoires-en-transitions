import { VignetteFetchedData } from '@/site/app/types';
import { fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export const getStrapiData = async () => {
  // Fetch du contenu de la page programme
  const data = await fetchSingle('page-programme', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'benefices_liste_markdown.image'],
    ['populate[3]', 'etapes_liste_markdown.image'],
    ['populate[4]', 'services_liste_rel.image'],
    ['populate[5]', 'compte_image'],
  ]);

  // Formattage de la data
  if (data) {
    const programmeData = data.attributes;

    const metaImage =
      (programmeData.seo?.metaImage?.data as unknown as StrapiItem)
        ?.attributes ?? undefined;

    return {
      seo: {
        metaTitle:
          (programmeData.seo?.metaTitle as unknown as string) ?? undefined,
        metaDescription:
          (programmeData.seo?.metaDescription as unknown as string) ??
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
      titre: programmeData.Titre as unknown as string,
      description:
        (programmeData.Description as unknown as string) ?? undefined,
      couvertureURL: (programmeData.VideoURL as unknown as string) ?? undefined,
      benefices: {
        titre: programmeData.benefices_titre as unknown as string,
        contenu:
          !!programmeData.benefices_liste_markdown &&
          programmeData.benefices_liste_markdown.length
            ? (
                programmeData.benefices_liste_markdown as unknown as VignetteFetchedData[]
              ).map((benef) => ({
                ...benef,
                image: benef.image?.data,
              }))
            : null,
      },
      contact: {
        description: programmeData.contact_description as unknown as string,
        cta: programmeData.contact_cta as unknown as string,
      },
      etapes: {
        titre: programmeData.etapes_titre as unknown as string,
        cta: programmeData.etapes_cta as unknown as string,
        contenu:
          !!programmeData.etapes_liste_markdown &&
          programmeData.etapes_liste_markdown.length
            ? (
                programmeData.etapes_liste_markdown as unknown as VignetteFetchedData[]
              ).map((et) => ({
                ...et,
                image: et.image?.data,
              }))
            : null,
      },
      services: {
        titre: programmeData.services_titre as unknown as string,
        contenu:
          !!programmeData.services_liste_rel.data &&
          programmeData.services_liste_rel.data.length
            ? (
                programmeData.services_liste_rel.data as unknown as {
                  id: number;
                  attributes: {
                    uid: string;
                    titre: string;
                    description_markdown: string;
                    image: { data: StrapiItem };
                    sous_page: boolean | undefined;
                  };
                }[]
              ).map((serv) => ({
                id: serv.id,
                uid: serv.attributes.uid,
                titre: serv.attributes.titre,
                description: serv.attributes.description_markdown,
                image: serv.attributes.image.data,
                sousPage: serv.attributes.sous_page ?? false,
              }))
            : null,
      },
      collectivites: {
        titre: programmeData.collectivites_titre as unknown as string,
        ctaCollectivites: programmeData.collectivites_cta as unknown as string,
        ctaAnnuaire: programmeData.annuaire_cta as unknown as string,
      },
      compte: {
        titre: programmeData.compte_titre as unknown as string,
        description: programmeData.compte_description as unknown as string,
        image:
          (programmeData.compte_image?.data as unknown as StrapiItem) ??
          undefined,
        cta: programmeData.compte_cta as unknown as string,
      },
    };
  } else return null;
};
