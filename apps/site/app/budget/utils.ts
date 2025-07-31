import { VignetteFetchedData } from '@/site/app/types';
import { fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export type TTableauBudget = {
  années: {
    [key: string]: string;
  };
  tableau: {
    [key: string]: {
      [key: string]: number;
    };
  };
};

export const getStrapiData = async () => {
  const data = await fetchSingle('page-budget', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'principes_liste_markdown'],
    ['populate[3]', 'principes_liste_markdown.image'],
    ['populate[4]', 'description_liste'],
    ['populate[5]', 'description_liste.image'],
  ]);

  if (data) {
    const budgetData = data.attributes;
    const seo = budgetData.seo;

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
        titre_secondaire: budgetData.titre_secondaire as unknown as string,
        titre_principal: budgetData.titre_principal as unknown as string,
        description: budgetData.description as unknown as string,
      },
      fonctionnement: {
        titre: budgetData.fonctionnement_titre as unknown as string,
        description: budgetData.fonctionnement_description as unknown as string,
      },
      principes: {
        titre: budgetData.principes_titre as unknown as string,
        description: budgetData.principes_description as unknown as string,
        liste: (
          budgetData.principes_liste_markdown as unknown as VignetteFetchedData[]
        ).map((p) => ({
          ...p,
          image: p.image?.data,
        })),
      },
      budgetConsomme: {
        titre: budgetData.budget_titre as unknown as string,
        description: budgetData.budget_description as unknown as string,
        tableau: budgetData.budget_tableau as unknown as TTableauBudget,
        repartitionCouts: {
          titre: budgetData.repartition_titre as unknown as string,
        },
        descriptionCouts: {
          titre: budgetData.description_titre as unknown as string,
          liste: (
            budgetData.description_liste as unknown as VignetteFetchedData[]
          ).map((d) => ({
            ...d,
            image: d.image?.data,
          })),
        },
        infoTva: {
          titre: budgetData.tva_titre as unknown as string,
          description: budgetData.tva_description as unknown as string,
        },
      },
      performanceBudget: {
        titre: budgetData.performance_titre as unknown as string,
        titre_edl: budgetData.performance_edl_titre as unknown as string,
        titre_fa: budgetData.performance_fa_titre as unknown as string,
      },
    };
  } else return null;
};
