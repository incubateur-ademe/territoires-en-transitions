import { fetchSingle } from '@/site/src/strapi/strapi';
import {
  Seo,
  StrapiEntry,
  StrapiMedia,
  Temoignage,
  VignetteAvecDetails,
  VignetteAvecMarkdown,
  VignetteAvecTitre,
} from '@/site/src/strapi/types';
import { Service } from './[uid]/types';

// Single type `api/page-programme`. Les médias, composants et relations ne
// sont présents que lorsqu'ils sont demandés dans `populate`.
export type PageProgramme = {
  seo?: Seo | null;
  Titre: string;
  Description: string | null;
  VideoURL: string | null;
  benefices_titre: string;
  benefices_liste?: VignetteAvecTitre[];
  benefices_liste_markdown?: VignetteAvecMarkdown[];
  contact_description: string;
  contact_cta: string;
  etapes_titre: string;
  etapes_liste?: VignetteAvecTitre[];
  etapes_liste_markdown?: VignetteAvecMarkdown[];
  etapes_cta: string;
  services_titre: string;
  services_liste_rel?: StrapiEntry<Service>[];
  collectivites_titre: string;
  collectivites_cta: string;
  annuaire_cta: string;
  compte_titre: string;
  compte_description: string;
  compte_cta: string;
  compte_image?: StrapiMedia | null;
};

/** Champs du single type `api/page-accueil` lus par la page programme. */
type PageAccueil = {
  couverture_desktop?: StrapiMedia;
  couverture_mobile?: StrapiMedia | null;
  accueil_titre: string;
  accueil_description: string;
  objectifs_titre: string;
  objectifs_liste_detaillee?: VignetteAvecDetails[];
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

/** Image Open Graph au format attendu par `getUpdatedMetadata`. */
export const buildSeoImage = (media: StrapiMedia | null | undefined) =>
  media
    ? {
        url: media.url,
        width: media.width ?? 0,
        height: media.height ?? 0,
        type: media.mime,
        alt: media.alternativeText ?? '',
      }
    : undefined;

export const getStrapiData = async () => {
  const [programme, accueil] = await Promise.all([
    fetchSingle<PageProgramme>('page-programme', [
      ['populate[seo][populate]', 'metaImage'],
      ['populate[benefices_liste_markdown][populate]', 'image'],
      ['populate[etapes_liste_markdown][populate]', 'image'],
      ['populate[services_liste_rel][populate]', 'image'],
      ['populate[compte_image]', 'true'],
    ]),
    fetchSingle<PageAccueil>('page-accueil', [
      ['populate[couverture_desktop]', 'true'],
      ['populate[couverture_mobile]', 'true'],
      ['populate[objectifs_liste_detaillee][populate][0]', 'image'],
      ['populate[objectifs_liste_detaillee][populate][1]', 'details_cta'],
      ['populate[temoignages_liste][populate][temoignage][populate]', 'portrait'],
    ]),
  ]);

  if (!programme || !accueil?.couverture_desktop) return null;

  const temoignages = accueil.temoignages_liste ?? [];
  const services = programme.services_liste_rel ?? [];

  return {
    banner: {
      couverture: accueil.couverture_desktop,
      couvertureMobile: accueil.couverture_mobile,
    },
    accompagnementIntro: {
      titre: accueil.accueil_titre,
      description: accueil.accueil_description,
    },
    objectifs: {
      titre: accueil.objectifs_titre,
      contenu: accueil.objectifs_liste_detaillee?.length
        ? accueil.objectifs_liste_detaillee.map((obj) => ({
            id: obj.id,
            titre: obj.titre ?? undefined,
            legende: obj.legende,
            image: obj.image,
            details: {
              titre: obj.details_titre ?? undefined,
              contenu: obj.details_texte,
              cta: obj.details_cta
                ? {
                    label: obj.details_cta.label,
                    url: obj.details_cta.url ?? undefined,
                  }
                : undefined,
            },
          }))
        : null,
    },
    seo: {
      metaTitle: programme.seo?.metaTitle ?? undefined,
      metaDescription: programme.seo?.metaDescription ?? undefined,
      metaImage: buildSeoImage(programme.seo?.metaImage),
    },
    titre: programme.Titre,
    description: programme.Description ?? undefined,
    couvertureURL: programme.VideoURL ?? undefined,
    benefices: {
      titre: programme.benefices_titre,
      contenu: programme.benefices_liste_markdown?.length
        ? programme.benefices_liste_markdown
        : null,
    },
    contact: {
      description: programme.contact_description,
      cta: programme.contact_cta,
    },
    etapes: {
      titre: programme.etapes_titre,
      cta: programme.etapes_cta,
      contenu: programme.etapes_liste_markdown?.length
        ? programme.etapes_liste_markdown
        : null,
    },
    services: {
      titre: programme.services_titre,
      contenu: services.length
        ? services.map((service) => ({
            documentId: service.documentId,
            uid: service.uid,
            titre: service.titre,
            description: service.description_markdown,
            image: service.image,
            sousPage: service.sous_page ?? false,
          }))
        : null,
    },
    collectivites: {
      titre: programme.collectivites_titre,
      ctaCollectivites: programme.collectivites_cta,
      ctaAnnuaire: programme.annuaire_cta,
    },
    compte: {
      titre: programme.compte_titre,
      description: programme.compte_description,
      image: programme.compte_image,
      cta: programme.compte_cta,
    },
    temoignages: temoignages.length
      ? {
          titre: accueil.temoignages_titre,
          contenu: temoignages.map((t) => ({
            id: t.id,
            auteur: t.temoignage.auteur,
            role: t.temoignage.role,
            temoignage: t.temoignage.temoignage,
            portrait: t.temoignage.portrait ?? undefined,
          })),
        }
      : null,
    newsletter: {
      titre: accueil.newsletter_titre,
      description: accueil.newsletter_description,
      ctaLinkedin: accueil.linkedin_btn,
      ctaNewsletter: accueil.newsletter_btn,
    },
  };
};
