import { Test } from '@nestjs/testing';
import DatabaseService from '../../common/services/database.service';
import {
  NiveauAcces,
  SupabaseRole,
  UtilisateurDroitType,
} from '../models/auth.models';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthService],
    })
      .useMocker((token) => {
        if (token === DatabaseService) {
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
          user_id: '1',
          collectivite_id: 1,
          niveau_acces: NiveauAcces.EDITION,
          active: true,
          created_at: new Date(),
          modified_at: null,
          invitation_id: null,
        },
        {
          id: 1,
          user_id: '1',
          collectivite_id: 2,
          niveau_acces: NiveauAcces.ADMIN,
          active: true,
          created_at: new Date(),
          modified_at: null,
          invitation_id: null,
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
          user_id: '1',
          collectivite_id: 1,
          niveau_acces: NiveauAcces.EDITION,
          active: true,
          created_at: new Date(),
          modified_at: null,
          invitation_id: null,
        },
        {
          id: 1,
          user_id: '1',
          collectivite_id: 2,
          niveau_acces: NiveauAcces.ADMIN,
          active: false,
          created_at: new Date(),
          modified_at: null,
          invitation_id: null,
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
          user_id: '1',
          collectivite_id: 1,
          niveau_acces: NiveauAcces.LECTURE,
          active: true,
          created_at: new Date(),
          modified_at: null,
          invitation_id: null,
        },
        {
          id: 1,
          user_id: '1',
          collectivite_id: 2,
          niveau_acces: NiveauAcces.ADMIN,
          active: true,
          created_at: new Date(),
          modified_at: null,
          invitation_id: null,
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
          user_id: '1',
          collectivite_id: 2,
          niveau_acces: NiveauAcces.EDITION,
          active: true,
          created_at: new Date(),
          modified_at: null,
          invitation_id: null,
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
