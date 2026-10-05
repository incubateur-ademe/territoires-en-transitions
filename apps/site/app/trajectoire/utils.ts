import { fetchSingle } from '@/site/src/strapi/strapi';
import {
  Seo,
  StrapiEntry,
  StrapiMedia,
  Temoignage,
  Vignette,
  VignetteAvecMarkdown,
} from '@/site/src/strapi/types';

/** Single type `page-trajectoire` (strapi/src/api/page-trajectoire). */
export type PageTrajectoire = {
  seo?: Seo | null;
  titre: string;
  couverture: StrapiMedia;
  cta_connexion: string;
  bloc1_titre: string;
  bloc1_texte: string;
  bloc1_image: StrapiMedia | null;
  bloc2_titre: string;
  bloc2_texte: string;
  bloc2_image: StrapiMedia | null;
  methode_titre: string;
  methode_description: string;
  methode_exemples?: Vignette[];
  methode_exemples_markdown: VignetteAvecMarkdown[];
  methode_image: StrapiMedia | null;
  webinaire_titre: string;
  webinaire_description: string;
  webinaire_cta: string;
  webinaire_url: string | null;
  calcul_titre: string;
  calcul_description: string;
  calcul_liste: VignetteAvecMarkdown[];
  temoignages_liste: StrapiEntry<{
    temoignage: Temoignage;
    identifiant: string;
  }>[];
  documentation_titre: string;
  documentation_description: string;
  documentation_info: string | null;
  documentation_excel: string;
  documentation_pdf: string;
};

export const getStrapiData = async () => {
  const data = await fetchSingle<PageTrajectoire>('page-trajectoire', [
    ['populate[seo][populate]', 'metaImage'],
    ['populate[couverture]', 'true'],
    ['populate[bloc1_image]', 'true'],
    ['populate[bloc2_image]', 'true'],
    ['populate[methode_exemples_markdown][populate]', 'image'],
    ['populate[methode_image]', 'true'],
    ['populate[calcul_liste][populate]', 'image'],
    ['populate[temoignages_liste][populate][temoignage][populate]', 'portrait'],
  ]);

  if (!data) return null;

  const metaImage = data.seo?.metaImage;

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
      couverture: data.couverture,
      ctaConnexion: data.cta_connexion,
    },
    presentation: {
      bloc1: {
        titre: data.bloc1_titre,
        texte: data.bloc1_texte,
        image: data.bloc1_image,
      },
      bloc2: {
        titre: data.bloc2_titre,
        texte: data.bloc2_texte,
        image: data.bloc2_image,
      },
    },
    methode: {
      titre: data.methode_titre,
      description: data.methode_description,
      exemples: data.methode_exemples_markdown,
      image: data.methode_image,
    },
    webinaire: {
      titre: data.webinaire_titre,
      description: data.webinaire_description,
      cta: data.webinaire_cta,
      url: data.webinaire_url,
    },
    calcul: {
      titre: data.calcul_titre,
      description: data.calcul_description,
      liste: data.calcul_liste,
    },
    temoignages: data.temoignages_liste.map((t) => ({
      id: t.id,
      auteur: t.temoignage.auteur,
      role: t.temoignage.role,
      temoignage: t.temoignage.temoignage,
      portrait: t.temoignage.portrait ?? undefined,
    })),
    documentation: {
      titre: data.documentation_titre,
      description: data.documentation_description,
      info: data.documentation_info,
      descriptionExcel: data.documentation_excel,
      descriptionPdf: data.documentation_pdf,
    },
  };
};
