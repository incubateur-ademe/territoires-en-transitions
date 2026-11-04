import type {
  IndicateurPersoNatureFields,
  IndicateurPredefiniNatureFields,
} from './indicateur-nature.schema';

export type IndicateurNatureFields = Readonly<{
  [Field in keyof IndicateurPersoNatureFields]:
    | IndicateurPersoNatureFields[Field]
    | IndicateurPredefiniNatureFields[Field];
}>;

export type IndicateurNatureError =
  | 'PERSO_WITH_IDENTIFIANT_REFERENTIEL'
  | 'PERSO_WITH_GROUPEMENT'
  | 'PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL';

export const isIndicateurPerso = <T extends IndicateurNatureFields>(
  indicateur: T
): indicateur is T & IndicateurPersoNatureFields =>
  indicateur.collectiviteId !== null &&
  indicateur.identifiantReferentiel === null &&
  indicateur.groupementId === null;

export const isIndicateurPredefini = <T extends IndicateurNatureFields>(
  indicateur: T
): indicateur is T & IndicateurPredefiniNatureFields =>
  indicateur.collectiviteId === null &&
  indicateur.identifiantReferentiel !== null;

export const getIncoherentNatureError = ({
  collectiviteId,
  identifiantReferentiel,
}: IndicateurNatureFields): IndicateurNatureError => {
  if (collectiviteId === null) {
    return 'PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL';
  }
  if (identifiantReferentiel !== null) {
    return 'PERSO_WITH_IDENTIFIANT_REFERENTIEL';
  }
  return 'PERSO_WITH_GROUPEMENT';
};
