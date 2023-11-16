import {fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';

export const getStrapiData = async () => {
  const data = await fetchSingle('page-outils-numerique', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'couverture'],
    ['populate[3]', 'avantages'],
    ['populate[4]', 'avantages.image'],
    ['populate[5]', 'fonctionnalites_image'],
    ['populate[6]', 'temoignages'],
    ['populate[7]', 'temoignages.portrait'],
    ['populate[8]', 'equipe_liste'],
    ['populate[9]', 'equipe_liste.image'],
    ['populate[10]', 'questions_liste'],
  ]);

  if (data) {
    const outilData = data.attributes;
    const seo = outilData.seo;

    const metaImage =
      (seo?.metaImage?.data as unknown as StrapiItem)?.attributes ??
      (data?.attributes.couverture.data as unknown as StrapiItem)?.attributes;

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
        titre: outilData.titre as unknown as string,
        accroche: outilData.accroche as unknown as string,
        cta_inscription: outilData.cta_inscription as unknown as string,
        url_inscription: outilData.url_inscription as unknown as string,
        cta_demo: outilData.cta_demo as unknown as string,
        url_demo: outilData.url_demo as unknown as string,
        couverture: outilData.couverture.data as unknown as StrapiItem,
      },
      avantages: (
        outilData.avantages as unknown as {
          id: number;
          legende: string;
          image: {data: StrapiItem};
        }[]
      ).map(av => ({
        ...av,
        image: av.image.data,
      })),
      fonctionnalites: {
        titre: outilData.fonctionnalites_titre as unknown as string,
        contenu: outilData.fonctionnalites_contenu as unknown as string,
        image: outilData.fonctionnalites_image.data as unknown as StrapiItem,
      },
      temoignages: (
        outilData.temoignages as unknown as {
          id: number;
          auteur: string;
          role: string;
          temoignage: string;
          portrait: {data: StrapiItem};
        }[]
      ).map(temoignage => ({
        ...temoignage,
        portrait: temoignage.portrait.data,
      })),
      equipe: {
        titre: outilData.equipe_titre as unknown as string,
        citation: outilData.equipe_citation as unknown as string,
        description: outilData.equipe_description as unknown as string,
        liste: (
          outilData.equipe_liste as unknown as {
            id: number;
            titre: string;
            legende: string;
            image: {data: StrapiItem};
          }[]
        ).map(eq => ({
          ...eq,
          image: eq.image.data,
        })),
        cta_contact: outilData.cta_contact as unknown as string,
      },
      questions: {
        titre: outilData.questions_titre as unknown as string,
        liste: outilData.questions_liste as unknown as {
          id: number;
          titre: string;
          contenu: string;
        }[],
      },
    };
  } else return null;
};
