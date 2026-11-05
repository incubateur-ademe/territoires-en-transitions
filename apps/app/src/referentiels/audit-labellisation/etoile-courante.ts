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
  if (canStartNewAuditCycle(parcours).canRequest || !etoileDemandee) {
    return null;
  }
  return (
    etoileEnumValues.find((etoile) => String(etoile) === etoileDemandee) ?? null
  );
};

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
  toEtoileRenouvelable(parcours.labellisation?.etoiles ?? 0);
