import type { DossierRecette } from './dossiers-recette.repository';

export type DossierRef = {
  tecDossierId: number;
  collectiviteId: number | null;
  collectiviteNom: string | null;
};

export const toDossierRef = (d: DossierRecette): DossierRef => ({
  tecDossierId: d.tecDossierId,
  collectiviteId: d.collectiviteId,
  collectiviteNom: d.collectiviteNom,
});

export const listExemples = (dossiers: DossierRecette[], nombre: number) =>
  dossiers
    .filter((d) => d.collectiviteId !== null)
    .slice(0, nombre)
    .map(toDossierRef);
