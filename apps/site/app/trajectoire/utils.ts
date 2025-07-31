import { VignetteFetchedData } from '@/site/app/types';
import { fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export const getStrapiData = async () => {
  const data = await fetchSingle('page-trajectoire', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'couverture'],
    ['populate[3]', 'bloc1_image'],
    ['populate[4]', 'bloc2_image'],
    ['populate[5]', 'methode_exemples_markdown'],
    ['populate[6]', 'methode_exemples_markdown.image'],
    ['populate[7]', 'methode_image'],
    ['populate[8]', 'calcul_liste'],
    ['populate[9]', 'calcul_liste.image'],
    ['populate[10]', 'temoignages_liste.temoignage'],
    ['populate[11]', 'temoignages_liste.temoignage.portrait'],
  ]);

  if (data) {
    const trajectoiresData = data.attributes;

    const seo = trajectoiresData.seo;

    const metaImage =
      (seo?.metaImage?.data as unknown as StrapiItem)?.attributes ?? undefined;

    return {
      seo: {
        metaTitle: (seo?.metaTitle as unknown as string) ?? undefined,
        metaDescription:
          (seo?.metaDescription as unknown as string) ?? undefined,
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
        description: trajectoiresData.methode_description as unknown as string,
        exemples: (
          trajectoiresData.methode_exemples_markdown as unknown as VignetteFetchedData[]
        ).map((ex) => ({
          ...ex,
          image: ex.image ? ex.image.data : undefined,
        })),
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
          trajectoiresData.calcul_liste as unknown as VignetteFetchedData[]
        ).map((c) => ({
          ...c,
          image: c.image ? c.image.data : undefined,
        })),
      },
      temoignages: (
        (trajectoiresData.temoignages_liste?.data as unknown as StrapiItem[]) ??
        []
      ).map((t) => ({
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
        info: trajectoiresData.documentation_info as unknown as string,
        descriptionExcel:
          trajectoiresData.documentation_excel as unknown as string,
        descriptionPdf: trajectoiresData.documentation_pdf as unknown as string,
      },
    };
  } else return null;
};
