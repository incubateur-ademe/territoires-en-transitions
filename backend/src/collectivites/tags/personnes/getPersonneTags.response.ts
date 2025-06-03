export type getPersonneTagsResponse = {
  tagId: number;
  tagNom: string;
  email?: string | null;
  nbFicheActionPilotes: number;
  nbFicheActionReferents: number;
  nbIndicateurPilotes: number;
  nbActionPilotes: number;
  invitationId?: string;
};
