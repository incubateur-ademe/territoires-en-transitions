import { Test } from '@nestjs/testing';
import DatabaseService from '../../common/services/database.service';
import {
  NiveauAcces,
  UtilisateurDroitType,
} from '../models/private-utilisateur-droit.table';
import { AuthService } from './auth.service';
import { SupabaseRole } from '../models/supabase-jwt.models';
import CollectivitesService from '../../collectivites/services/collectivites.service';

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
          SupabaseRole.AUTHENTICATED,
          [],
          [1],
          NiveauAcces.LECTURE,
        ),
      ).toBe(false);
    });

    it('Utilisateur anonyme', async () => {
      expect(
        authService.aDroitsSuffisants(
          SupabaseRole.ANON,
          [],
          [],
          NiveauAcces.LECTURE,
        ),
      ).toBe(false);
    });

    it('Service role', async () => {
      expect(
        authService.aDroitsSuffisants(
          SupabaseRole.SERVICE_ROLE,
          [],
          [1, 2, 3],
          NiveauAcces.ADMIN,
        ),
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
          modifiedAt: null,
          invitationId: null,
        },
        {
          id: 1,
          userId: '1',
          collectiviteId: 2,
          niveauAcces: NiveauAcces.ADMIN,
          active: true,
          createdAt: new Date(),
          modifiedAt: null,
          invitationId: null,
        },
      ];

      expect(
        authService.aDroitsSuffisants(
          SupabaseRole.AUTHENTICATED,
          droits,
          [1, 2],
          NiveauAcces.EDITION,
        ),
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
          modifiedAt: null,
          invitationId: null,
        },
        {
          id: 1,
          userId: '1',
          collectiviteId: 2,
          niveauAcces: NiveauAcces.ADMIN,
          active: false,
          createdAt: new Date(),
          modifiedAt: null,
          invitationId: null,
        },
      ];

      expect(
        authService.aDroitsSuffisants(
          SupabaseRole.AUTHENTICATED,
          droits,
          [1, 2],
          NiveauAcces.EDITION,
        ),
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
          modifiedAt: null,
          invitationId: null,
        },
        {
          id: 1,
          userId: '1',
          collectiviteId: 2,
          niveauAcces: NiveauAcces.ADMIN,
          active: true,
          createdAt: new Date(),
          modifiedAt: null,
          invitationId: null,
        },
      ];

      expect(
        authService.aDroitsSuffisants(
          SupabaseRole.AUTHENTICATED,
          droits,
          [1, 2],
          NiveauAcces.EDITION,
        ),
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
          modifiedAt: null,
          invitationId: null,
        },
      ];

      expect(
        authService.aDroitsSuffisants(
          SupabaseRole.AUTHENTICATED,
          droits,
          [1, 2],
          NiveauAcces.EDITION,
        ),
      ).toBe(false);
    });
  });
});
