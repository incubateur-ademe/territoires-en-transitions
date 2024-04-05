import {fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';

export const getStrapiData = async () => {
  // Fetch du contenu de la page programme
  const data = await fetchSingle('page-programme', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'Objectifs'],
    ['populate[3]', 'objectifs_liste.image'],
    ['populate[4]', 'Services'],
    ['populate[5]', 'services_liste_rel'],
    ['populate[6]', 'services_liste_rel.image'],
    ['populate[7]', 'compte_cta.lien'],
    ['populate[8]', 'Benefices'],
    ['populate[9]', 'benefices_liste'],
    ['populate[10]', 'etapes_liste'],
    ['populate[11]', 'etapes_cta.lien'],
    ['populate[12]', 'ressources_cta.lien'],
  ]);

  // Formattage de la data
  if (data) {
    const programmeData = data.attributes;

    const metaImage =
      (programmeData.seo?.metaImage?.data as unknown as StrapiItem)
        ?.attributes ?? undefined;

    return {
      // SEO
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

      // EN-TÊTE
      titre: programmeData.Titre as unknown as string,
      description:
        (programmeData.Description as unknown as string) ?? undefined,
      couvertureURL: (programmeData.VideoURL as unknown as string) ?? undefined,

      // OBJECTIFS
      objectifs: {
        titre: programmeData.Objectifs.Titre as unknown as string,
        description: programmeData.Objectifs.Description as unknown as string,
        contenu:
          !!programmeData.objectifs_liste &&
          programmeData.objectifs_liste.length
            ? (
                programmeData.objectifs_liste as unknown as {
                  id: number;
                  legende: string;
                  image: {data: StrapiItem};
                }[]
              ).map(obj => ({
                id: obj.id,
                description: obj.legende,
                image: obj.image.data,
              }))
            : null,
      },

      // SERVICES
      services: {
        titre: programmeData.Services.Titre as unknown as string,
        description: programmeData.Services.Description as unknown as string,
        contenu:
          !!programmeData.services_liste_rel.data &&
          programmeData.services_liste_rel.data.length
            ? (
                programmeData.services_liste_rel.data as unknown as {
                  id: number;
                  attributes: {
                    uid: string;
                    titre: string;
                    description: string;
                    image: {data: StrapiItem};
                    sous_page: boolean | undefined;
                  };
                }[]
              ).map(serv => ({
                id: serv.id,
                uid: serv.attributes.uid,
                titre: serv.attributes.titre,
                description: serv.attributes.description,
                image: serv.attributes.image.data,
                sousPage: serv.attributes.sous_page ?? false,
              }))
            : null,
      },

      // CREER UN COMPTE
      compte: {
        description: programmeData.compte_titre as unknown as string,
        cta: {
          label: (programmeData.compte_cta.label_custom ??
            programmeData.compte_cta.lien.data.attributes
              .label_defaut) as unknown as string,
          url: programmeData.compte_cta.lien.data.attributes
            .url as unknown as string,
        },
      },

      // BENEFICES
      benefices: {
        titre: programmeData.Benefices.Titre as unknown as string,
        description: programmeData.Benefices.Description as unknown as string,
        contenu:
          !!programmeData.benefices_liste &&
          programmeData.benefices_liste.length
            ? (
                programmeData.benefices_liste as unknown as {
                  id: number;
                  titre: string;
                  legende: string;
                }[]
              ).map(benef => ({
                id: benef.id,
                titre: benef.titre,
                description: benef.legende,
              }))
            : null,
      },

      // ETAPES
      etapes: {
        titre: programmeData.etapes_titre as unknown as string,
        contenu:
          !!programmeData.etapes_liste && programmeData.etapes_liste.length
            ? (
                programmeData.etapes_liste as unknown as {
                  id: number;
                  titre: string;
                  legende: string;
                }[]
              ).map(et => ({
                id: et.id,
                titre: et.titre,
                description: et.legende,
              }))
            : null,
        cta: {
          label: (programmeData.etapes_cta.label_custom ??
            programmeData.etapes_cta.lien.data.attributes
              .label_defaut) as unknown as string,
          url: programmeData.etapes_cta.lien.data.attributes
            .url as unknown as string,
        },
      },

      // RESSOURCES
      ressources: {
        description: programmeData.ressources_titre as unknown as string,
        cta: (
          programmeData.ressources_cta as unknown as {
            id: number;
            lien: {
              data: {
                attributes: {uid: string; url: string; label_defaut: string};
              };
            };
            label_custom: string;
          }[]
        ).map(r => ({
          label: (r.label_custom ??
            r.lien.data.attributes.label_defaut) as unknown as string,
          url: r.lien.data.attributes.url as unknown as string,
        })),
      },
    };
  } else return null;
};
