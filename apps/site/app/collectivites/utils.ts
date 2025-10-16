import { Tables } from '@/api';
import { supabase } from '@/site/app/initSupabase';
import { EtoilesLabel } from '@/site/app/types';
import { fetchCollection, fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';

export type Labellisations = Tables<'labellisation'>;
export type Indicateurs = {
  date_valeur: string;
  resultat: number;
  identifiant: string;
  source?: string;
};
export type IndicateurArtificialisation =
  Tables<'indicateur_artificialisation'>;

type Collectivite = {
  collectivite_id: number;
  nom: string;
  type_collectivite: string;
  nature_collectivite: string;
  code_siren_insee: string;
  region_name: string;
  region_code: string;
  departement_name: string;
  departement_code: string;
  population_totale: number;
  active: true;
  cot: false;
  engagee: true;
  labellisee: true;
  cae_obtenue_le: string;
  cae_etoiles: EtoilesLabel;
  cae_score_realise: number;
  cae_score_programme: number;
  eci_obtenue_le: string;
  eci_etoiles: EtoilesLabel;
  eci_score_realise: number;
  eci_score_programme: number;
  labellisations: Labellisations[];
  indicateurs_gaz_effet_serre: Indicateurs[] | null;
  indicateur_artificialisation: IndicateurArtificialisation | null;
};

export const fetchCollectivite = async (code_siren_insee: string) => {
  // Validate code_siren_insee, accept 5-9 digits (INSEE/SIREN codes)
  if (!/^\d{5,9}$/.test(code_siren_insee)) {
    throw new Error(`Invalid code_siren_insee: ${code_siren_insee}`);
  }

  const { data, error } = await supabase
    .from('site_labellisation')
    .select(
      '*,labellisations, indicateurs_gaz_effet_serre, indicateur_artificialisation'
    )
    .match({ code_siren_insee });

  if (error) {
    throw new Error(`site_labellisation-${code_siren_insee}`);
  }
  if (!data || !data.length) {
    return null;
  }

  const collectivite = data[0] as unknown as Collectivite;
  let annuaireUrl = null;

  if (collectivite.type_collectivite === 'commune') {
    const response = await fetch(
      `https://api.collectivite.fr/api/commune/url/${code_siren_insee}`,
      { method: 'GET' }
    );

    if (response.status === 200) {
      annuaireUrl = await response.text();
    }
  }

  return { collectivite, annuaireUrl };
};

export const getStrapiData = async (codeSirenInsee: string) => {
  const { data } = await fetchCollection('collectivites', [
    ['filters[code_siren_insee]', `${codeSirenInsee}`],
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'couverture'],
    ['populate[3]', 'logo'],
    ['populate[4]', 'temoignages'],
    ['populate[5]', 'temoignages.portrait'],
    ['populate[6]', 'actions'],
    ['populate[7]', 'actions.image'],
  ]);

  if (data && data.length) {
    const collectiviteData = data[0].attributes;
    const isContentDefined =
      (collectiviteData.actions as unknown as unknown[]).length > 0;

    const metaImage =
      (collectiviteData.seo?.metaImage?.data as unknown as StrapiItem)
        ?.attributes ??
      (collectiviteData?.attributes?.couverture.data as unknown as StrapiItem)
        ?.attributes;

    return {
      seo: {
        metaTitle:
          (collectiviteData.seo?.metaTitle as unknown as string) ??
          (collectiviteData.nom as unknown as string),
        metaDescription:
          (collectiviteData.seo?.metaDescription as unknown as string) ??
          undefined,
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
      nom: collectiviteData.nom as unknown as string,
      code_siren_insee: collectiviteData.code_siren_insee as unknown as string,
      couverture:
        (collectiviteData.couverture.data as unknown as StrapiItem) ??
        undefined,
      logo: (collectiviteData.logo.data as unknown as StrapiItem) ?? undefined,
      url: (collectiviteData.url as unknown as string) ?? undefined,
      contenu: isContentDefined
        ? {
            video:
              (collectiviteData.video_url as unknown as string) ?? undefined,
            video_en_haut:
              (collectiviteData.video_en_haut as unknown as boolean) ?? false,
            temoignages: (
              collectiviteData.temoignages as unknown as {
                id: number;
                auteur: string;
                role: string;
                temoignage: string;
                portrait: { data: StrapiItem };
              }[]
            ).map((temoignage) => ({
              ...temoignage,
              portrait: temoignage.portrait.data,
            })),
            actions: (
              collectiviteData.actions as unknown as {
                id: number;
                titre: string;
                contenu: string;
                image: { data: StrapiItem };
              }[]
            ).map((action) => ({
              ...action,
              image: action.image.data,
            })),
          }
        : undefined,
    };
  } else return null;
};

export const getStrapiDefaultData = async () => {
  const data = await fetchSingle('page-collectivite', [
    ['populate[0]', 'seo'],
    ['populate[1]', 'seo.metaImage'],
    ['populate[2]', 'couverture'],
    ['populate[3]', 'artificialisation_sols'],
    ['populate[4]', 'artificialisation_sols.illustration_encadre'],
    ['populate[5]', 'gaz_effet_serre'],
    ['populate[6]', 'gaz_effet_serre.illustration_encadre'],
  ]);

  if (data) {
    const seo = data.attributes.seo;
    const artificialisation_sols = data.attributes.artificialisation_sols;
    const gaz_effet_serre = data.attributes.gaz_effet_serre;

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
      couverture: data.attributes.couverture.data as unknown as StrapiItem,
      inscription: {
        description:
          (data.attributes.inscription_description as unknown as string) ??
          undefined,
        cta:
          (data.attributes.inscription_cta as unknown as string) ?? undefined,
      },
      connexion: {
        description:
          (data.attributes.connexion_description as unknown as string) ??
          undefined,
        cta: (data.attributes.connexionn_cta as unknown as string) ?? undefined,
      },
      indicateurs: {
        artificialisation_sols: artificialisation_sols
          ? {
              titre: artificialisation_sols.titre as unknown as string,
              description:
                artificialisation_sols.description as unknown as string,
              titre_encadre:
                artificialisation_sols.titre_encadre as unknown as string,
              description_encadre:
                artificialisation_sols.description_encadre as unknown as string,
              illustration_encadre: artificialisation_sols.illustration_encadre
                .data as unknown as StrapiItem,
              details:
                (artificialisation_sols.details as unknown as string) ??
                undefined,
            }
          : undefined,
        gaz_effet_serre: gaz_effet_serre
          ? {
              titre: gaz_effet_serre.titre as unknown as string,
              description: gaz_effet_serre.description as unknown as string,
              titre_encadre: gaz_effet_serre.titre_encadre as unknown as string,
              description_encadre:
                gaz_effet_serre.description_encadre as unknown as string,
              illustration_encadre: gaz_effet_serre.illustration_encadre
                .data as unknown as StrapiItem,
              details:
                (gaz_effet_serre.details as unknown as string) ?? undefined,
            }
          : undefined,
      },
    };
  } else return null;
};

export const getCollectivitesALaUne = async () =>
  await fetchCollection('collectivites', [
    ['filters[est_a_la_une]', 'true'],
    ['pagination[pageSize]', '6'],
    ['populate[0]', 'couverture'],
  ]);
