import { personnalisationUrlKeys } from './personnalisation-url-keys.constants';

export const openedThematiquesUrlKeys = {
  openedThematiques: 'ot',
  autoOpenThematiques: 'ao',
} as const;

export const personnalisationPageUrlKeys = {
  ...personnalisationUrlKeys,
  ...openedThematiquesUrlKeys,
} as const;

export type PersonnalisationPageSearchParams = Partial<{
  thematiqueIds: string[] | null;
  referentielIds: string[] | null;
  actionIds: string[] | null;
  openedThematiques: string[] | null;
  autoOpenThematiques: boolean | null;
}>;

const serializeStringArray = (values: string[] | null | undefined) => {
  if (!values?.length) {
    return undefined;
  }
  return values.join(',');
};

export const personnalisationPageSearchParamsSerializer = (
  params: PersonnalisationPageSearchParams
): string => {
  const searchParams = new URLSearchParams();

  const thematiqueIds = serializeStringArray(params.thematiqueIds);
  if (thematiqueIds) {
    searchParams.set(personnalisationPageUrlKeys.thematiqueIds, thematiqueIds);
  }

  const referentielIds = serializeStringArray(params.referentielIds);
  if (referentielIds) {
    searchParams.set(personnalisationPageUrlKeys.referentielIds, referentielIds);
  }

  const actionIds = serializeStringArray(params.actionIds);
  if (actionIds) {
    searchParams.set(personnalisationPageUrlKeys.actionIds, actionIds);
  }

  const openedThematiques = serializeStringArray(params.openedThematiques);
  if (openedThematiques) {
    searchParams.set(
      personnalisationPageUrlKeys.openedThematiques,
      openedThematiques
    );
  }

  if (params.autoOpenThematiques === true) {
    searchParams.set(personnalisationPageUrlKeys.autoOpenThematiques, 'true');
  } else if (params.autoOpenThematiques === false) {
    searchParams.set(personnalisationPageUrlKeys.autoOpenThematiques, 'false');
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const personnalisationActionLinkSearchParams = (
  actionId: string
): PersonnalisationPageSearchParams => ({
  actionIds: [actionId],
  autoOpenThematiques: true,
});
