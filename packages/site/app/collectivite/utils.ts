import {supabase} from 'app/initSupabase';
import {fetchCollection} from 'src/strapi/strapi';
import {StrapiItem} from 'src/strapi/StrapiItem';

export const fetchCollectivite = async (code_siren_insee: string) => {
  const {data, error} = await supabase
    .from('site_labellisation')
    .select()
    .match({code_siren_insee});

  if (error) {
    throw new Error(`site_labellisation-${code_siren_insee}`);
  }
  if (!data || !data.length) {
    return null;
  }

  return data[0];
};

export const getStrapiData = async (codeSirenInsee: string) => {
  const data = await fetchCollection('collectivites', [
    ['filters[code_siren_insee]', `${codeSirenInsee}`],
    ['populate[0]', 'couverture'],
    ['populate[1]', 'logo'],
    ['populate[2]', 'actions'],
    ['populate[3]', 'actions.image'],
  ]);

  if (data && data.length) {
    const collectiviteData = data[0].attributes;
    const isContentDefined =
      (collectiviteData.actions as unknown as {}[]).length > 0;

    return {
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
            actions: (
              collectiviteData.actions as unknown as {
                id: string;
                titre: string;
                contenu: string;
                image: {data: StrapiItem};
              }[]
            ).map(action => ({
              ...action,
              image: action.image.data,
            })),
          }
        : undefined,
    };
  } else return null;
};
