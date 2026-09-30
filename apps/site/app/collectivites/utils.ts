import { fetchCollection, fetchSingle } from '@/site/src/strapi/strapi';
import { StrapiItem } from '@/site/src/strapi/StrapiItem';
import { getSiteTrpcClient } from '@/site/src/trpc/trpc-client';
import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';

export type Indicateurs = {
  date_valeur: string;
  resultat: number;
  identifiant: string;
  periodicite: IndicateurPeriodicite;
  source?: string;
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
