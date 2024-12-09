import { DatabaseService } from '@/backend/utils';
import { Test } from '@nestjs/testing';
import { CollectivitesService } from '../../collectivites/shared/services/collectivites.service';
import { AuthRole } from '../models/auth.models';
import {
  NiveauAcces,
  UtilisateurDroitType,
} from '../models/private-utilisateur-droit.table';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthService],
    })
      .useMocker((token) => {
        if (token === DatabaseService || token === CollectivitesService) {
          return {};
        }
      })
      .compile();

    authService = moduleRef.get(AuthService);
  });

  describe('aDroitsSuffisants', () => {
    it("Utilisateur qui n'a aucun droit", async () => {
      expect(
        authService.aDroitsSuffisants(
          AuthRole.AUTHENTICATED,
          [],
          [1],
          NiveauAcces.LECTURE
        )
      ).toBe(false);
    });

    it('Utilisateur anonyme', async () => {
      expect(
        authService.aDroitsSuffisants(
          AuthRole.ANON,
          [],
          [],
          NiveauAcces.LECTURE
        )
      ).toBe(false);
    });

    it('Service role', async () => {
      expect(
        authService.aDroitsSuffisants(
          AuthRole.SERVICE_ROLE,
          [],
          [1, 2, 3],
          NiveauAcces.ADMIN
        )
      ).toBe(true);
    });

    it('Utilisateur qui a les droits', async () => {
      const droits: UtilisateurDroitType[] = [
        {
          id: 1,
          userId: '1',
          collectiviteId: 1,
          niveauAcces: NiveauAcces.EDITION,
          active: true,
          createdAt: new Date(),
          modifiedAt: new Date(),
          invitationId: null,
        },
        {
          id: 1,
          userId: '1',
          collectiviteId: 2,
          niveauAcces: NiveauAcces.ADMIN,
          active: true,
          createdAt: new Date(),
          modifiedAt: new Date(),
          invitationId: null,
        },
      ];

      expect(
        authService.aDroitsSuffisants(
          AuthRole.AUTHENTICATED,
          droits,
          [1, 2],
          NiveauAcces.EDITION
        )
      ).toBe(true);
    });

    it('Utilisateur qui a les droits mais 1 est inactif', async () => {
      const droits: UtilisateurDroitType[] = [
        {
          id: 1,
          userId: '1',
          collectiviteId: 1,
          niveauAcces: NiveauAcces.EDITION,
          active: true,
          createdAt: new Date(),
          modifiedAt: new Date(),
          invitationId: null,
        },
        {
          id: 1,
          userId: '1',
          collectiviteId: 2,
          niveauAcces: NiveauAcces.ADMIN,
          active: false,
          createdAt: new Date(),
          modifiedAt: new Date(),
          invitationId: null,
        },
      ];

      expect(
        authService.aDroitsSuffisants(
          AuthRole.AUTHENTICATED,
          droits,
          [1, 2],
          NiveauAcces.EDITION
        )
      ).toBe(false);
    });

    it('Utilisateur qui a les droits mais pas du bon niveau', async () => {
      const droits: UtilisateurDroitType[] = [
        {
          id: 1,
          userId: '1',
          collectiviteId: 1,
          niveauAcces: NiveauAcces.LECTURE,
          active: true,
          createdAt: new Date(),
          modifiedAt: new Date(),
          invitationId: null,
        },
        {
          id: 1,
          userId: '1',
          collectiviteId: 2,
          niveauAcces: NiveauAcces.ADMIN,
          active: true,
          createdAt: new Date(),
          modifiedAt: new Date(),
          invitationId: null,
        },
      ];

      expect(
        authService.aDroitsSuffisants(
          AuthRole.AUTHENTICATED,
          droits,
          [1, 2],
          NiveauAcces.EDITION
        )
      ).toBe(false);
    });

    it('Utilisateur qui a partiellement les droits', async () => {
      const droits: UtilisateurDroitType[] = [
        {
          id: 1,
          userId: '1',
          collectiviteId: 2,
          niveauAcces: NiveauAcces.EDITION,
          active: true,
          createdAt: new Date(),
          modifiedAt: new Date(),
          invitationId: null,
        },
      ];

      expect(
        authService.aDroitsSuffisants(
          AuthRole.AUTHENTICATED,
          droits,
          [1, 2],
          NiveauAcces.EDITION
        )
      ).toBe(false);
    });
  });
});
