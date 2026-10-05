import { fetchSingle } from '@/site/src/strapi/strapi';
import {
  Seo,
  StrapiEntry,
  StrapiMedia,
  Temoignage,
  Vignette,
  VignetteAvecMarkdown,
} from '@/site/src/strapi/types';

/** Single type `page-outils-numerique` (strapi/src/api/page-outils-numerique). */
export type PageOutilsNumerique = {
  seo?: Seo | null;
  titre: string;
  accroche: string;
  cta_inscription: string;
  url_inscription: string;
  cta_demo: string;
  url_demo: string;
  couverture: StrapiMedia;
  avantages?: Vignette[];
  avantages_liste: VignetteAvecMarkdown[];
  panier_titre: string;
  panier_description: string;
  panier_image?: StrapiMedia | null;
  panier_cta: string;
  trajectoire_titre: string;
  trajectoire_description: string;
  trajectoire_image: StrapiMedia | null;
  trajectoire_cta: string;
  temoignages_liste: StrapiEntry<{
    temoignage: Temoignage;
    identifiant: string;
  }>[];
  equipe_titre: string;
  equipe_citation: string | null;
  equipe_description: string | null;
  equipe_cta: string;
  questions_titre: string;
  questions_description: string | null;
  cta_faq: string;
  cta_contact: string;
};

export const getStrapiData = async () => {
  const data = await fetchSingle<PageOutilsNumerique>('page-outils-numerique', [
    ['populate[seo][populate]', 'metaImage'],
    ['populate[couverture]', 'true'],
    ['populate[avantages_liste][populate]', 'image'],
    ['populate[trajectoire_image]', 'true'],
    ['populate[temoignages_liste][populate][temoignage][populate]', 'portrait'],
  ]);

  if (!data) return null;

  const metaImage = data.seo?.metaImage ?? data.couverture;

  return {
    seo: {
      metaTitle: data.seo?.metaTitle ?? undefined,
      metaDescription: data.seo?.metaDescription ?? undefined,
      metaImage: metaImage
        ? {
            url: metaImage.url,
            width: metaImage.width ?? 0,
            height: metaImage.height ?? 0,
            type: metaImage.mime,
            alt: metaImage.alternativeText ?? '',
          }
        : undefined,
    },
    header: {
      titre: data.titre,
      accroche: data.accroche,
      cta_inscription: data.cta_inscription,
      url_inscription: data.url_inscription,
      cta_demo: data.cta_demo,
      url_demo: data.url_demo,
      couverture: data.couverture,
    },
    avantages: data.avantages_liste,
    trajectoire: {
      titre: data.trajectoire_titre,
      description: data.trajectoire_description,
      image: data.trajectoire_image ?? undefined,
      cta: data.trajectoire_cta,
    },
    temoignages: data.temoignages_liste.map((t) => ({
      id: t.id,
      auteur: t.temoignage.auteur,
      role: t.temoignage.role,
      temoignage: t.temoignage.temoignage,
      portrait: t.temoignage.portrait ?? undefined,
    })),
    equipe: {
      titre: data.equipe_titre,
      citation: data.equipe_citation,
      description: data.equipe_description,
      cta: data.equipe_cta,
    },
    questions: {
      titre: data.questions_titre,
      description: data.questions_description ?? undefined,
      cta_faq: data.cta_faq,
      cta_contact: data.cta_contact,
    },
  };
};
