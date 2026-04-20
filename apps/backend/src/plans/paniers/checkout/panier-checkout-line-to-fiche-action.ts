import {
  FicheCreate,
  PanierCheckoutLine,
  PanierCheckoutLineStatut,
} from '@tet/domain/plans';
import { UpdateFicheInput } from '../../fiches/update-fiche/update-fiche.input';

const STATUT_FICHE_BY_PANIER_CHECKOUT_LINE_STATUT: Record<
  Exclude<PanierCheckoutLineStatut, null>,
  'En cours' | 'Réalisé'
> = {
  en_cours: 'En cours',
  realise: 'Réalisé',
};

const resolveStatut = (
  statut: PanierCheckoutLineStatut
): 'À venir' | 'En cours' | 'Réalisé' =>
  statut === null ? 'À venir' : STATUT_FICHE_BY_PANIER_CHECKOUT_LINE_STATUT[statut];

export const panierCheckoutLineToFicheAction = (
  line: PanierCheckoutLine,
  ctx: {
    collectiviteId: number;
    planId: number;
    partenaireTagsByName: Map<string, number>;
  }
): { fiche: FicheCreate; ficheFields: Omit<UpdateFicheInput, 'id'> } => {
  const fiche: FicheCreate = {
    collectiviteId: ctx.collectiviteId,
    titre: line.titre,
    description: `${line.description}\n${line.descriptionComplementaire}`,
    financements: line.fourchetteBudgetaireNom,
    statut: resolveStatut(line.statut),
  };

  const partenaires = line.partenaireNoms
    .map((nom) => ctx.partenaireTagsByName.get(nom))
    .filter((id): id is number => id !== undefined)
    .map((id) => ({ id }));

  const ficheFields: Omit<UpdateFicheInput, 'id'> = {
    axes: [{ id: ctx.planId }],
    thematiques: line.thematiqueIds.map((id) => ({ id })),
    sousThematiques: line.sousThematiqueIds.map((id) => ({ id })),
    effetsAttendus: line.effetAttenduIds.map((id) => ({ id })),
    mesures: line.mesureIds.map((id) => ({ id })),
    indicateurs: line.indicateurIds.map((id) => ({ id })),
    partenaires,
    actionsImpact: [{ id: line.sourceActionImpactId }],
  };

  return { fiche, ficheFields };
};
