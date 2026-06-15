import { Etoile, EtoileEnum } from './labellisation-etoile.enum.schema';

export const ETOILE_MIN_REALISE_SCORE: Record<Etoile, number> = {
  [EtoileEnum.PREMIERE_ETOILE]: 0,
  [EtoileEnum.DEUXIEME_ETOILE]: 0.35,
  [EtoileEnum.TROISIEME_ETOILE]: 0.5,
  [EtoileEnum.QUATRIEME_ETOILE]: 0.65,
  [EtoileEnum.CINQUIEME_ETOILE]: 0.75,
};

const ETOILES_DESC = [
  EtoileEnum.CINQUIEME_ETOILE,
  EtoileEnum.QUATRIEME_ETOILE,
  EtoileEnum.TROISIEME_ETOILE,
  EtoileEnum.DEUXIEME_ETOILE,
  EtoileEnum.PREMIERE_ETOILE,
] as const;

export const getMaxRequestableStar = (scoreFait: number): Etoile =>
  ETOILES_DESC.find((etoile) => scoreFait >= ETOILE_MIN_REALISE_SCORE[etoile]) ??
  EtoileEnum.PREMIERE_ETOILE;
