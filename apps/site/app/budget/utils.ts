import { toOpenGraphImage } from '@/site/src/strapi/media';
import { fetchSingle } from '@/site/src/strapi/strapi';
import { Seo, Vignette, VignetteAvecMarkdown } from '@/site/src/strapi/types';

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

/** Single type `page-budget` (strapi/src/api/page-budget). */
export type PageBudget = {
  seo?: Seo | null;
  titre_secondaire: string | null;
  titre_principal: string;
  description: string;
  fonctionnement_titre: string;
  fonctionnement_description: string;
  principes_titre: string;
  principes_description: string | null;
  principes_liste?: Vignette[];
  principes_liste_markdown: VignetteAvecMarkdown[];
  budget_titre: string;
  budget_description: string;
  budget_tableau: TTableauBudget;
  repartition_titre: string;
  description_titre: string;
  description_liste: VignetteAvecMarkdown[];
  tva_titre: string;
  tva_description: string;
  performance_titre: string;
  performance_edl_titre: string;
  performance_fa_titre: string;
};

export const getStrapiData = async () => {
  const data = await fetchSingle<PageBudget>('page-budget', [
    ['populate[seo][populate]', 'metaImage'],
    ['populate[principes_liste_markdown][populate]', 'image'],
    ['populate[description_liste][populate]', 'image'],
  ]);

  if (!data) return null;

  const metaImage = data.seo?.metaImage;

  return {
    seo: {
      metaTitle: data.seo?.metaTitle ?? undefined,
      metaDescription: data.seo?.metaDescription ?? undefined,
      metaImage: toOpenGraphImage(metaImage),
    },
    header: {
      titre_secondaire: data.titre_secondaire,
      titre_principal: data.titre_principal,
      description: data.description,
    },
    fonctionnement: {
      titre: data.fonctionnement_titre,
      description: data.fonctionnement_description,
    },
    principes: {
      titre: data.principes_titre,
      description: data.principes_description,
      liste: data.principes_liste_markdown,
    },
    budgetConsomme: {
      titre: data.budget_titre,
      description: data.budget_description,
      tableau: data.budget_tableau,
      repartitionCouts: {
        titre: data.repartition_titre,
      },
      descriptionCouts: {
        titre: data.description_titre,
        liste: data.description_liste,
      },
      infoTva: {
        titre: data.tva_titre,
        description: data.tva_description,
      },
    },
    performanceBudget: {
      titre: data.performance_titre,
      titre_edl: data.performance_edl_titre,
      titre_fa: data.performance_fa_titre,
    },
  };
};
