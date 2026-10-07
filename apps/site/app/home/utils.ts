import { toOpenGraphImage } from '@/site/src/strapi/media';
import { fetchSingle } from '@/site/src/strapi/strapi';
import {
  Seo,
  StrapiEntry,
  StrapiMedia,
  Temoignage,
  VignetteAvecCta,
  VignetteAvecDetails,
  VignetteAvecMarkdown,
} from '@/site/src/strapi/types';

/** Single type `page-accueil` (strapi/src/api/page-accueil). */
export type PageAccueil = {
  seo?: Seo | null;
  couverture_desktop?: StrapiMedia;
  couverture_mobile?: StrapiMedia | null;
  accueil_titre: string;
  accueil_description: string;
  programme?: VignetteAvecCta;
  plateforme?: VignetteAvecCta;
  objectifs_titre: string;
  objectifs_liste?: VignetteAvecMarkdown[];
  objectifs_liste_detaillee?: VignetteAvecDetails[];
  collectivites_titre: string;
  collectivites_cta: string;
  contact_description: string;
  contact_cta: string;
  temoignages_titre: string;
  temoignages_liste?: StrapiEntry<{
    temoignage: Temoignage;
    identifiant: string;
  }>[];
  newsletter_titre: string;
  newsletter_description: string;
  linkedin_btn: string;
  newsletter_btn: string;
};

export const getMetaData = async () => {
  const data = await fetchSingle<PageAccueil>('page-accueil', [
    ['populate[seo][populate]', 'metaImage'],
    ['populate[couverture_desktop]', 'true'],
  ]);

  if (!data) return null;

  const metaImage = data.seo?.metaImage ?? data.couverture_desktop;

  return {
    metaTitle: data.seo?.metaTitle ?? undefined,
    metaDescription: data.seo?.metaDescription ?? data.accueil_description,
    metaImage: toOpenGraphImage(metaImage),
  };
};

/**
 * Contenu de la page d'accueil. Seuls les témoignages viennent encore de
 * Strapi : les autres sections de `home.page.tsx` sont codées en dur.
 */
export const getData = async () => {
  const data = await fetchSingle<PageAccueil>('page-accueil', [
    ['populate[temoignages_liste][populate][temoignage][populate]', 'portrait'],
  ]);

  if (!data) return null;

  return {
    temoignages: (data.temoignages_liste ?? []).map((t) => ({
      id: t.id,
      auteur: t.temoignage.auteur,
      role: t.temoignage.role,
      temoignage: t.temoignage.temoignage,
      portrait: t.temoignage.portrait ?? undefined,
    })),
  };
};
