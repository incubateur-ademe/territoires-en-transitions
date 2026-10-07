import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { describe, expect, it } from 'vitest';
import GetDemarcheUrlService from './get-demarche-url.service';

const service = new GetDemarcheUrlService({
  get: () => 'https://app.territoiresentransitions.fr',
} as unknown as ConfigurationService);

describe('GetDemarcheUrlService', () => {
  it('points a service instructeur at the dossier of the collectivité it instructs', () => {
    // Le piège que ce test fige : l'URL porte l'identifiant de la déposante, et
    // non celui du service destinataire — sinon l'agent tombe sur un 404.
    expect(
      service.getDossierInstructionUrl({
        collectiviteInstruiteId: 42,
        demandeAvisId: 7,
      })
    ).toBe(
      'https://app.territoiresentransitions.fr/collectivite/42/instruction/7'
    );
  });

  it('builds the démarche url seen by the collectivité', () => {
    expect(
      service.getDemarchePcaetUrl({ collectiviteId: 42, demarcheId: 12 })
    ).toBe(
      'https://app.territoiresentransitions.fr/collectivite/42/demarche-pcaet/12'
    );
  });

  it('builds the documents url', () => {
    expect(
      service.getDemarchePcaetDocumentsUrl({
        collectiviteId: 42,
        demarcheId: 12,
      })
    ).toBe(
      'https://app.territoiresentransitions.fr/collectivite/42/demarche-pcaet/12/documents'
    );
  });
});
