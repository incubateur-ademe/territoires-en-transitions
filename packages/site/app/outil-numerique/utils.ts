import {fetchSingle} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';

export const getStrapiData = async () => {
  const data = await fetchSingle('page-outils-numerique', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'cta_inscription_new.lien'],
    ['populate[3]', 'cta_demo_new.lien'],
    ['populate[4]', 'couverture'],
    ['populate[5]', 'avantages'],
    ['populate[6]', 'avantages.image'],
    ['populate[7]', 'fonctionnalites_image'],
    ['populate[8]', 'temoignages_liste.temoignage'],
    ['populate[9]', 'temoignages_liste.temoignage.portrait'],
    ['populate[10]', 'equipe_liste'],
    ['populate[11]', 'equipe_liste.image'],
    ['populate[12]', 'cta_contact_new.lien'],
    ['populate[13]', 'questions_liste'],
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
        cta_inscription: (outilData.cta_inscription_new.label_custom ??
          outilData.cta_inscription_new.lien.data.attributes
            .label_defaut) as unknown as string,
        url_inscription: outilData.cta_inscription_new.lien.data.attributes
          .url as unknown as string,
        cta_demo: (outilData.cta_demo_new.label_custom ??
          outilData.cta_demo_new.lien.data.attributes
            .label_defaut) as unknown as string,
        url_demo: outilData.cta_demo_new.lien.data.attributes
          .url as unknown as string,
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
        (outilData.temoignages_liste.data as unknown as StrapiItem[]) ?? []
      ).map(t => ({
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
        cta_contact: (outilData.cta_contact_new.label_custom ??
          outilData.cta_contact_new.lien.data.attributes
            .label_defaut) as unknown as string,
        cta_url: outilData.cta_contact_new.lien.data.attributes
          .url as unknown as string,
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
