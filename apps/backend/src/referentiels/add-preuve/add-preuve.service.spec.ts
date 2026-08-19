import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import { describe, expect, it, vi } from 'vitest';
import { AddPreuveRepository } from './add-preuve.repository';
import { AddPreuveService } from './add-preuve.service';

const editorUser = { id: 'user-id' } as AuthenticatedUser;

type BuildServiceParams = {
  isAllowed?: boolean;
  actionIdByPreuve?: string | null;
  fichierCollectiviteId?: number;
};

function buildService({
  isAllowed = true,
  actionIdByPreuve = 'cae_1.1.3.2',
  fichierCollectiviteId = 1,
}: BuildServiceParams = {}) {
  const permissionService = {
    isAllowed: vi.fn().mockResolvedValue(
      isAllowed
        ? { success: true, data: undefined }
        : { success: false, error: CommonErrorEnum.UNAUTHORIZED }
    ),
  } as unknown as PermissionService;

  const addPreuveRepository = {
    getActionIdByPreuveReglementaireId: vi
      .fn()
      .mockResolvedValue(actionIdByPreuve),
    getFichierCollectiviteId: vi.fn().mockResolvedValue(fichierCollectiviteId),
    addPreuveReglementaireWithFile: vi
      .fn()
      .mockResolvedValue({ success: true, data: { id: 11 } }),
    addPreuveReglementaireWithLink: vi
      .fn()
      .mockResolvedValue({ success: true, data: { id: 12 } }),
    addPreuveComplementaireWithFile: vi
      .fn()
      .mockResolvedValue({ success: true, data: { id: 21 } }),
    addPreuveComplementaireWithLink: vi
      .fn()
      .mockResolvedValue({ success: true, data: { id: 22 } }),
  } as unknown as AddPreuveRepository;

  return {
    service: new AddPreuveService(permissionService, addPreuveRepository),
    permissionService,
    addPreuveRepository,
  };
}

describe('AddPreuveService', () => {
  it("renvoie NOT_FOUND quand la preuve réglementaire n'est reliée à aucune action", async () => {
    const { service, addPreuveRepository } = buildService({
      actionIdByPreuve: null,
    });

    const result = await service.addPreuveReglementaire(
      {
        collectiviteId: 1,
        preuveId: 'preuve-inconnue',
        fichierId: 10,
      },
      editorUser
    );

    expect(result).toEqual({
      success: false,
      error: CommonErrorEnum.NOT_FOUND,
    });
    expect(
      addPreuveRepository.addPreuveReglementaireWithFile
    ).not.toHaveBeenCalled();
  });

  it('renvoie UNAUTHORIZED quand la collectivité ne peut pas modifier le référentiel réglementaire', async () => {
    const { service, addPreuveRepository } = buildService({
      isAllowed: false,
    });

    const result = await service.addPreuveReglementaire(
      {
        collectiviteId: 1,
        preuveId: 'etude_vulnerabiliteCC',
        fichierId: 10,
      },
      editorUser
    );

    expect(result).toEqual({
      success: false,
      error: CommonErrorEnum.UNAUTHORIZED,
    });
    expect(
      addPreuveRepository.addPreuveReglementaireWithFile
    ).not.toHaveBeenCalled();
  });

  it("renvoie NOT_FOUND quand le fichier réglementaire appartient à une autre collectivité", async () => {
    const { service, addPreuveRepository } = buildService({
      fichierCollectiviteId: 2,
    });

    const result = await service.addPreuveReglementaire(
      {
        collectiviteId: 1,
        preuveId: 'etude_vulnerabiliteCC',
        fichierId: 10,
      },
      editorUser
    );

    expect(result).toEqual({
      success: false,
      error: CommonErrorEnum.NOT_FOUND,
    });
    expect(
      addPreuveRepository.addPreuveReglementaireWithFile
    ).not.toHaveBeenCalled();
  });

  it('propage la création réglementaire fichier avec le commentaire normalisé et le modifiedBy', async () => {
    const { service, addPreuveRepository } = buildService();

    const result = await service.addPreuveReglementaire(
      {
        collectiviteId: 1,
        preuveId: 'etude_vulnerabiliteCC',
        fichierId: 10,
      },
      editorUser
    );

    expect(result).toEqual({ success: true, data: { id: 11 } });
    expect(
      addPreuveRepository.addPreuveReglementaireWithFile
    ).toHaveBeenCalledWith({
      collectiviteId: 1,
      preuveId: 'etude_vulnerabiliteCC',
      fichierId: 10,
      commentaire: '',
      modifiedBy: editorUser.id,
    });
  });

  it('propage la création réglementaire lien avec le commentaire fourni', async () => {
    const { service, addPreuveRepository } = buildService();

    const result = await service.addPreuveReglementaire(
      {
        collectiviteId: 1,
        preuveId: 'etude_vulnerabiliteCC',
        lien: {
          url: 'https://example.com/reglementaire',
          titre: 'Titre réglementaire',
        },
        commentaire: 'commentaire',
      },
      editorUser
    );

    expect(result).toEqual({ success: true, data: { id: 12 } });
    expect(
      addPreuveRepository.addPreuveReglementaireWithLink
    ).toHaveBeenCalledWith({
      collectiviteId: 1,
      preuveId: 'etude_vulnerabiliteCC',
      lien: {
        url: 'https://example.com/reglementaire',
        titre: 'Titre réglementaire',
      },
      commentaire: 'commentaire',
      modifiedBy: editorUser.id,
    });
  });

  it("renvoie NOT_FOUND quand l'action complémentaire est invalide", async () => {
    const { service, permissionService } = buildService();

    const result = await service.addPreuveComplementaire(
      {
        collectiviteId: 1,
        actionId: 'action-invalide',
        fichierId: 10,
      },
      editorUser
    );

    expect(result).toEqual({
      success: false,
      error: CommonErrorEnum.NOT_FOUND,
    });
    expect(permissionService.isAllowed).not.toHaveBeenCalled();
  });

  it('renvoie UNAUTHORIZED quand la collectivité ne peut pas modifier le référentiel complémentaire', async () => {
    const { service, addPreuveRepository } = buildService({
      isAllowed: false,
    });

    const result = await service.addPreuveComplementaire(
      {
        collectiviteId: 1,
        actionId: 'cae_1.1.3.2',
        fichierId: 10,
      },
      editorUser
    );

    expect(result).toEqual({
      success: false,
      error: CommonErrorEnum.UNAUTHORIZED,
    });
    expect(
      addPreuveRepository.addPreuveComplementaireWithFile
    ).not.toHaveBeenCalled();
  });

  it("renvoie NOT_FOUND quand le fichier complémentaire appartient à une autre collectivité", async () => {
    const { service, addPreuveRepository } = buildService({
      fichierCollectiviteId: 2,
    });

    const result = await service.addPreuveComplementaire(
      {
        collectiviteId: 1,
        actionId: 'cae_1.1.3.2',
        fichierId: 10,
      },
      editorUser
    );

    expect(result).toEqual({
      success: false,
      error: CommonErrorEnum.NOT_FOUND,
    });
    expect(
      addPreuveRepository.addPreuveComplementaireWithFile
    ).not.toHaveBeenCalled();
  });

  it('propage la création complémentaire fichier avec le commentaire normalisé et le modifiedBy', async () => {
    const { service, addPreuveRepository } = buildService();

    const result = await service.addPreuveComplementaire(
      {
        collectiviteId: 1,
        actionId: 'cae_1.1.3.2',
        fichierId: 10,
      },
      editorUser
    );

    expect(result).toEqual({ success: true, data: { id: 21 } });
    expect(
      addPreuveRepository.addPreuveComplementaireWithFile
    ).toHaveBeenCalledWith({
      collectiviteId: 1,
      actionId: 'cae_1.1.3.2',
      fichierId: 10,
      commentaire: '',
      modifiedBy: editorUser.id,
    });
  });

  it('propage la création complémentaire lien avec le commentaire normalisé', async () => {
    const { service, addPreuveRepository, permissionService } = buildService();

    const result = await service.addPreuveComplementaire(
      {
        collectiviteId: 1,
        actionId: 'cae_1.1.3.2',
        lien: {
          url: 'https://example.com/complementaire',
          titre: 'Titre complémentaire',
        },
      },
      editorUser
    );

    expect(result).toEqual({ success: true, data: { id: 22 } });
    expect(permissionService.isAllowed).toHaveBeenCalled();
    expect(
      addPreuveRepository.addPreuveComplementaireWithLink
    ).toHaveBeenCalledWith({
      collectiviteId: 1,
      actionId: 'cae_1.1.3.2',
      lien: {
        url: 'https://example.com/complementaire',
        titre: 'Titre complémentaire',
      },
      commentaire: '',
      modifiedBy: editorUser.id,
    });
  });
});