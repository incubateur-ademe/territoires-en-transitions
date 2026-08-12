import { Etoile } from '../labellisation-etoile.enum.schema';
import { ObjetPreuve, ObjetPreuveEnum } from '../objet-preuve.enum.schema';

export type PreuveWithObjet = { objet: ObjetPreuve | null };

export const getExpectedDocuments = ({
  isCot,
  premiereEtoileObtenue,
  etoile,
}: {
  isCot: boolean;
  premiereEtoileObtenue: boolean;
  etoile: Etoile;
}): ObjetPreuve[] => [
  ...(!isCot && !premiereEtoileObtenue
    ? [ObjetPreuveEnum.ACTE_ENGAGEMENT]
    : []),
  ...(etoile > 1 ? [ObjetPreuveEnum.CANDIDATURE] : []),
];

export const areExpectedDocumentsDeposited = ({
  preuves,
  expectedDocuments,
}: {
  preuves: readonly PreuveWithObjet[];
  expectedDocuments: readonly ObjetPreuve[];
}): boolean =>
  expectedDocuments.every((expectedDocument) =>
    preuves.some((preuve) => preuve.objet === expectedDocument)
  );

export const selectPreuvesByObjet = <T extends PreuveWithObjet>({
  preuves,
  objet,
}: {
  preuves: readonly T[];
  objet: ObjetPreuve;
}): T[] => preuves.filter((preuve) => preuve.objet === objet);
