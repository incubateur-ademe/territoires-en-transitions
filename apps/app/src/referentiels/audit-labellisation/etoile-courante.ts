import {
  canStartNewAuditCycle,
  Etoile,
  etoileEnumValues,
  EtoileEnum,
  ParcoursLabellisation,
} from '@tet/domain/referentiels';

type ParcoursPourEtoileCourante = Pick<
  ParcoursLabellisation,
  'status' | 'demande' | 'labellisation'
>;

const toEtoileDemandeeEnCours = (
  parcours: ParcoursPourEtoileCourante
): Etoile | null => {
  const etoileDemandee = parcours.demande?.etoiles;
  const isNoDemandeInProgress =
    canStartNewAuditCycle(parcours).canRequest || !etoileDemandee;
  if (isNoDemandeInProgress) {
    return null;
  }
  return (
    etoileEnumValues.find((etoile) => String(etoile) === etoileDemandee) ?? null
  );
};

const toEtoileObtenue = (etoiles: number | undefined): Etoile | 0 =>
  etoileEnumValues.find((etoile) => etoile === etoiles) ?? 0;

const toEtoileRenouvelable = (etoilesObtenues: Etoile | 0): Etoile => {
  if (etoilesObtenues === 0) {
    return EtoileEnum.PREMIERE_ETOILE;
  }
  if (etoilesObtenues === EtoileEnum.PREMIERE_ETOILE) {
    return EtoileEnum.DEUXIEME_ETOILE;
  }
  return etoilesObtenues;
};

export const toEtoileCourante = (
  parcours: ParcoursPourEtoileCourante
): Etoile =>
  toEtoileDemandeeEnCours(parcours) ??
  toEtoileRenouvelable(toEtoileObtenue(parcours.labellisation?.etoiles));
