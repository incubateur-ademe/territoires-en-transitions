import type { DemarchePcaet, DemarchePcaetPublic } from '@tet/domain/demarches';

/** Ne garde de la démarche que ce que la lecture publique en montre. */
export const toDemarchePcaetPublic = (
  demarche: Omit<DemarchePcaetPublic, 'pilotes'> &
    Pick<DemarchePcaet, 'pilotes'>
): DemarchePcaetPublic => ({
  id: demarche.id,
  collectiviteId: demarche.collectiviteId,
  titre: demarche.titre,
  status: demarche.status,
  obligation: demarche.obligation,
  launchedAt: demarche.launchedAt,
  publishedAt: demarche.publishedAt,
  adoptedAt: demarche.adoptedAt,
  transmittedOffPlatform: demarche.transmittedOffPlatform,
  createdAt: demarche.createdAt,
  modifiedAt: demarche.modifiedAt,
  pilotes: demarche.pilotes.map(({ nom }) => ({ nom })),
});
