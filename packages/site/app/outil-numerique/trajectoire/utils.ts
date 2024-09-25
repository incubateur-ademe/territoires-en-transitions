import {fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';

export const getStrapiData = async () => {
  const data = await fetchSingle('page-trajectoire', [
    ['populate[0]', 'couverture'],
    ['populate[1]', 'bloc1_image'],
    ['populate[2]', 'bloc2_image'],
    ['populate[3]', 'methode_exemples'],
    ['populate[4]', 'methode_exemples.image'],
    ['populate[5]', 'methode_image'],
    ['populate[6]', 'calcul_liste'],
    ['populate[7]', 'calcul_liste.image'],
    ['populate[8]', 'temoignages_liste.temoignage'],
    ['populate[9]', 'temoignages_liste.temoignage.portrait'],
  ]);

  if (data) {
    const trajectoiresData = data.attributes;

    return {
      header: {
        titre: trajectoiresData.titre as unknown as string,
        couverture: trajectoiresData.couverture.data as unknown as StrapiItem,
        ctaConnexion: trajectoiresData.cta_connexion as unknown as string,
      },
      presentation: {
        bloc1: {
          titre: trajectoiresData.bloc1_titre as unknown as string,
          texte: trajectoiresData.bloc1_texte as unknown as string,
          image: trajectoiresData.bloc1_image.data as unknown as StrapiItem,
        },
        bloc2: {
          titre: trajectoiresData.bloc2_titre as unknown as string,
          texte: trajectoiresData.bloc2_texte as unknown as string,
          image: trajectoiresData.bloc2_image.data as unknown as StrapiItem,
        },
      },
      methode: {
        titre: trajectoiresData.methode_titre as unknown as string,
        description1:
          trajectoiresData.methode_description1 as unknown as string,
        exemples: (
          trajectoiresData.methode_exemples as unknown as {
            id: number;
            legende: string;
            image: {data: StrapiItem};
          }[]
        ).map(ex => ({
          id: ex.id,
          legende: ex.legende,
          image: ex.image ? ex.image.data : undefined,
        })),
        detailExemples:
          trajectoiresData.methode_exemples_detail as unknown as string,
        description2:
          trajectoiresData.methode_description2 as unknown as string,
        alerte: trajectoiresData.methode_alerte as unknown as string,
        image: trajectoiresData.methode_image.data as unknown as StrapiItem,
      },
      webinaire: {
        titre: trajectoiresData.webinaire_titre as unknown as string,
        description:
          trajectoiresData.webinaire_description as unknown as string,
        cta: trajectoiresData.webinaire_cta as unknown as string,
        url: trajectoiresData.webinaire_url as unknown as string,
      },
      calcul: {
        titre: trajectoiresData.calcul_titre as unknown as string,
        description: trajectoiresData.calcul_description as unknown as string,
        liste: (
          trajectoiresData.calcul_liste as unknown as {
            id: number;
            titre: string;
            legende: string;
            image: {data: StrapiItem};
          }[]
        ).map(c => ({
          id: c.id,
          titre: c.titre,
          legende: c.legende,
          image: c.image ? c.image.data : undefined,
        })),
      },
      temoignages: (
        (trajectoiresData.temoignages_liste?.data as unknown as StrapiItem[]) ??
        []
      ).map(t => ({
        id: t.id,
        auteur: t.attributes.temoignage?.auteur as unknown as string,
        role: t.attributes.temoignage?.role as unknown as string,
        temoignage: t.attributes.temoignage?.temoignage as unknown as string,
        portrait:
          (t.attributes.temoignage?.portrait.data as unknown as StrapiItem) ??
          undefined,
      })),
      documentation: {
        titre: trajectoiresData.documentation_titre as unknown as string,
        description:
          trajectoiresData.documentation_description as unknown as string,
        descriptionExcel:
          trajectoiresData.documentation_excel as unknown as string,
        descriptionPdf: trajectoiresData.documentation_pdf as unknown as string,
      },
    };
  } else return null;
};
