import { toOpenGraphImage } from '@/site/src/strapi/media';
import { fetchCollection, fetchSingle } from '@/site/src/strapi/strapi';
import {
  Seo,
  StrapiComponent,
  StrapiMedia,
  Temoignage,
} from '@/site/src/strapi/types';
import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';

/** Composant `contenu.texte-collectivite` */
export type TexteCollectivite = StrapiComponent<{
  titre: string;
  contenu: string;
  image?: StrapiMedia | null;
}>;

/** Composant `contenu.indicateur` */
export type Indicateur = StrapiComponent<{
  titre: string;
  description: string;
  titre_encadre: string;
  description_encadre: string;
  illustration_encadre: StrapiMedia;
  details: string | null;
}>;

/** Collection `collectivite` */
export type Collectivite = {
  seo?: Seo | null;
  nom: string;
  code_siren_insee: string;
  logo?: StrapiMedia | null;
  couverture: StrapiMedia | null;
  url: string | null;
  video_url: string | null;
  video_en_haut: boolean;
  temoignages?: Temoignage[];
  actions?: TexteCollectivite[];
  est_a_la_une: boolean | null;
};

/** Single type `page-collectivite` */
export type PageCollectivite = {
  seo?: Seo | null;
  couverture: StrapiMedia;
  inscription_description: string;
  inscription_cta: string;
  connexion_description: string;
  connexion_cta: string;
  gaz_effet_serre?: Indicateur | null;
  artificialisation_sols?: Indicateur | null;
};

const CODE_INSEE_COMMUNE_REGEX = /^(\d{5}|2[AB]\d{3})$/;

export const fetchCollectivite = async (codeSirenInsee: string) => {
  const collectivite =
    await getSiteTrpcClient().collectivites.site.getCollectivite.query({
      codeSirenInsee,
    });

  if (!collectivite) {
    return null;
  }

  let annuaireUrl = null;

  // On interroge l'annuaire avec le code connu en base (et non le paramètre
  // d'URL), après avoir vérifié qu'il s'agit bien d'un code INSEE de commune.
  const codeInsee = collectivite.codeSirenInsee;
  if (
    collectivite.typeCollectivite === 'commune' &&
    codeInsee &&
    CODE_INSEE_COMMUNE_REGEX.test(codeInsee)
  ) {
    const response = await fetch(
      `https://api.collectivite.fr/api/commune/url/${encodeURIComponent(
        codeInsee
      )}`,
      { method: 'GET' }
    );

    if (response.status === 200) {
      annuaireUrl = await response.text();
    }
  }

  return { collectivite, annuaireUrl };
};

export const getStrapiData = async (codeSirenInsee: string) => {
  // Mélanger `populate[0]=couverture` et `populate[seo][populate]=metaImage`
  // donne un objet dont Strapi ignore la clé « 0 » : tout passe par des clés nommées.
  const { data } = await fetchCollection<Collectivite>('collectivites', [
    ['filters[code_siren_insee]', codeSirenInsee],
    ['populate[seo][populate]', 'metaImage'],
    ['populate[couverture]', 'true'],
    ['populate[logo]', 'true'],
    ['populate[temoignages][populate]', 'portrait'],
    ['populate[actions][populate]', 'image'],
  ]);

  const collectivite = data?.[0];
  if (!collectivite) return null;

  const { seo, temoignages = [], actions = [] } = collectivite;
  const metaImage = seo?.metaImage ?? collectivite.couverture;

  return {
    seo: {
      metaTitle: seo?.metaTitle ?? collectivite.nom,
      metaDescription: seo?.metaDescription ?? undefined,
      metaImage: toOpenGraphImage(metaImage),
    },
    nom: collectivite.nom,
    code_siren_insee: collectivite.code_siren_insee,
    couverture: collectivite.couverture ?? undefined,
    logo: collectivite.logo ?? undefined,
    url: collectivite.url ?? undefined,
    contenu:
      actions.length > 0
        ? {
            video: collectivite.video_url,
            video_en_haut: collectivite.video_en_haut ?? false,
            temoignages,
            actions,
          }
        : undefined,
  };
};

export const getStrapiDefaultData = async () => {
  const data = await fetchSingle<PageCollectivite>('page-collectivite', [
    ['populate[seo][populate]', 'metaImage'],
    ['populate[couverture]', 'true'],
    ['populate[artificialisation_sols][populate]', 'illustration_encadre'],
    ['populate[gaz_effet_serre][populate]', 'illustration_encadre'],
  ]);

  if (!data) return null;

  const { seo, artificialisation_sols, gaz_effet_serre } = data;
  const metaImage = seo?.metaImage ?? data.couverture;

  return {
    seo: {
      metaTitle: seo?.metaTitle ?? undefined,
      metaDescription: seo?.metaDescription ?? undefined,
      metaImage: toOpenGraphImage(metaImage),
    },
    couverture: data.couverture,
    inscription: {
      description: data.inscription_description,
      cta: data.inscription_cta,
    },
    connexion: {
      description: data.connexion_description,
      cta: data.connexion_cta,
    },
    indicateurs: {
      artificialisation_sols: artificialisation_sols ?? undefined,
      gaz_effet_serre: gaz_effet_serre ?? undefined,
    },
  };
};

export const getCollectivitesALaUne = async () => {
  const { data } = await fetchCollection<Collectivite>('collectivites', [
    ['filters[est_a_la_une]', 'true'],
    ['pagination[pageSize]', '6'],
    ['populate[0]', 'couverture'],
  ]);
  return data ?? [];
};
