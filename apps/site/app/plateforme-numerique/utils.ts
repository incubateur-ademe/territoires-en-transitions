import { VignetteFetchedData } from '@/site/app/types';
import { fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export const getStrapiData = async () => {
  const data = await fetchSingle('page-outils-numerique', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'couverture'],
    ['populate[3]', 'avantages_liste.image'],
    ['populate[4]', 'panier_image'],
    ['populate[5]', 'trajectoire_image'],
    ['populate[6]', 'temoignages_liste.temoignage'],
    ['populate[7]', 'temoignages_liste.temoignage.portrait'],
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
        outilData.avantages_liste as unknown as VignetteFetchedData[]
      ).map((av) => ({
        ...av,
        image: av.image?.data,
      })),
      panier: {
        titre: outilData.panier_titre as unknown as string,
        description: outilData.panier_description as unknown as string,
        image:
          (outilData.panier_image?.data as unknown as StrapiItem) ?? undefined,
        cta: outilData.panier_cta as unknown as string,
      },
      trajectoire: {
        titre: outilData.trajectoire_titre as unknown as string,
        description: outilData.trajectoire_description as unknown as string,
        image:
          (outilData.trajectoire_image?.data as unknown as StrapiItem) ??
          undefined,
        cta: outilData.trajectoire_cta as unknown as string,
      },
      temoignages: (
        (outilData.temoignages_liste.data as unknown as StrapiItem[]) ?? []
      ).map((t) => ({
        id: t.id,
        auteur: t.attributes.temoignage?.auteur as unknown as string,
        role: t.attributes.temoignage?.role as unknown as string,
        temoignage: t.attributes.temoignage?.temoignage as unknown as string,
        portrait:
          (t.attributes.temoignage?.portrait.data as unknown as StrapiItem) ??
          undefined,
      })),
      equipe: {
        titre: outilData.equipe_titre as unknown as string,
        citation: outilData.equipe_citation as unknown as string,
        description: outilData.equipe_description as unknown as string,
        cta: outilData.equipe_cta as unknown as string,
      },
      questions: {
        titre: outilData.questions_titre as unknown as string,
        description:
          (outilData.questions_description as unknown as string) ?? undefined,
        cta_faq: outilData.cta_faq as unknown as string,
        cta_contact: outilData.cta_contact as unknown as string,
      },
    };
  } else return null;
};
