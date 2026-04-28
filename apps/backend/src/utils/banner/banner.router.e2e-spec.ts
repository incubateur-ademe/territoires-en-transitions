import { INestApplication } from '@nestjs/common';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
  addUserRoleSupport,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
} from 'vitest';
import { bannerInfoTable } from './banner-info.table';

const SENTINEL = 'Équipe support';

describe('Banner', () => {
  let router: TrpcRouter;
  let testUser: AuthenticatedUser;
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    const testUserResult = await addTestUser(databaseService);
    testUser = getAuthUserFromUserCredentials(testUserResult.user);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clear banner_info between tests so each starts from a known empty state.
    // The singleton CHECK (id = 1) means the next insert always lands at id=1.
    await databaseService.db.delete(bannerInfoTable);
  });

  describe('banner.get', () => {
    test('Returns null when no banner exists', async () => {
      const caller = router.createCaller({ user: testUser });
      const result = await caller.banner.get();
      expect(result).toBeNull();
    });

    test('Caller without utils.banner.mutate sees the sentinel modifiedByNom', async () => {
      await databaseService.db.insert(bannerInfoTable).values({
        type: 'info',
        info: '<p>Hello</p>',
        active: true,
      });

      const caller = router.createCaller({ user: testUser });
      const result = await caller.banner.get();

      expect(result).toEqual({
        type: 'info',
        info: '<p>Hello</p>',
        active: true,
        modifiedAt: expect.any(String),
        modifiedByNom: SENTINEL,
      });
      expect(result).not.toHaveProperty('modifiedBy');
      expect(result).not.toHaveProperty('id');
    });

    test('Caller with utils.banner.mutate sees the real modifier name (createdByNom)', async () => {
      const caller = router.createCaller({ user: testUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: testUser.id,
      });
      onTestFinished(cleanup);

      await caller.banner.upsert({
        type: 'info',
        info: '<p>Hello</p>',
        active: true,
      });

      const result = await caller.banner.get();

      expect(result).not.toBeNull();
      expect(result?.modifiedByNom).not.toBe(SENTINEL);
      expect(result?.modifiedByNom).toEqual(expect.any(String));
      expect((result?.modifiedByNom ?? '').trim().length).toBeGreaterThan(0);
    });

    test('Returns the inactive draft to non-support callers with sentinel name', async () => {
      await databaseService.db.insert(bannerInfoTable).values({
        type: 'warning',
        info: '<p>Old draft</p>',
        active: false,
      });

      const caller = router.createCaller({ user: testUser });
      const result = await caller.banner.get();

      expect(result).toEqual({
        type: 'warning',
        info: '<p>Old draft</p>',
        active: false,
        modifiedAt: expect.any(String),
        modifiedByNom: SENTINEL,
      });
    });
  });

  describe('banner.upsert', () => {
    test('Refuses caller without SUPER_ADMIN role', async () => {
      const caller = router.createCaller({ user: testUser });

      await expect(
        caller.banner.upsert({
          type: 'info',
          info: '<p>x</p>',
          active: true,
        })
      ).rejects.toThrowError(/super-admin actif/);
    });

    test('Refuses support user with mode disabled', async () => {
      const { cleanup } = await addUserRoleSupport({
        databaseService,
        userId: testUser.id,
        isSupport: true,
        isSuperAdminRoleEnabled: false,
      });
      onTestFinished(cleanup);

      const caller = router.createCaller({ user: testUser });

      await expect(
        caller.banner.upsert({
          type: 'info',
          info: '<p>x</p>',
          active: true,
        })
      ).rejects.toThrowError(/super-admin actif/);
    });

    test('Creates a banner when none exists (SUPER_ADMIN)', async () => {
      const caller = router.createCaller({ user: testUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: testUser.id,
      });
      onTestFinished(cleanup);

      const result = await caller.banner.upsert({
        type: 'info',
        info: '<p>Bienvenue</p>',
        active: true,
      });

      // SUPER_ADMIN holds utils.banner.mutate → sees the real createdByNom
      // value (Prénom Nom of the test user), not the sentinel.
      expect(result).toMatchObject({
        type: 'info',
        info: '<p>Bienvenue</p>',
        active: true,
        modifiedAt: expect.any(String),
        modifiedByNom: expect.any(String),
      });
      expect(result.modifiedByNom).not.toBe(SENTINEL);

      const rows = await databaseService.db.select().from(bannerInfoTable);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(1); // singleton invariant
      expect(rows[0].modifiedBy).toBe(testUser.id);
    });

    test('Updates the existing row in place (singleton — INSERT ON CONFLICT DO UPDATE)', async () => {
      const caller = router.createCaller({ user: testUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: testUser.id,
      });
      onTestFinished(cleanup);

      await caller.banner.upsert({
        type: 'info',
        info: '<p>v1</p>',
        active: true,
      });

      const updated = await caller.banner.upsert({
        type: 'warning',
        info: '<p>v2</p>',
        active: true,
      });

      expect(updated.type).toBe('warning');
      expect(updated.info).toBe('<p>v2</p>');

      const rows = await databaseService.db.select().from(bannerInfoTable);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(1);
    });

    describe('Server-side sanitization', () => {
      const xssPayloads: Array<{
        name: string;
        input: string;
        mustNotContain: string;
      }> = [
        { name: 'script tag', input: '<p>ok</p><script>alert(1)</script>', mustNotContain: '<script' },
        { name: 'iframe tag', input: '<p>ok</p><iframe src="evil"></iframe>', mustNotContain: '<iframe' },
        { name: 'style tag', input: '<p>ok</p><style>body{display:none}</style>', mustNotContain: '<style' },
        { name: 'link tag', input: '<p>ok</p><link rel="stylesheet" href="evil">', mustNotContain: '<link' },
        { name: 'object tag', input: '<p>ok</p><object data="evil"></object>', mustNotContain: '<object' },
        { name: 'embed tag', input: '<p>ok</p><embed src="evil">', mustNotContain: '<embed' },
        { name: 'meta tag', input: '<p>ok</p><meta http-equiv="refresh" content="0;url=evil">', mustNotContain: '<meta' },
        { name: 'onclick handler', input: '<p onclick="alert(1)">ok</p>', mustNotContain: 'onclick' },
        { name: 'onerror handler', input: '<p>ok</p><img src=x onerror="alert(1)">', mustNotContain: 'onerror' },
        { name: 'onload handler', input: '<svg onload="alert(1)"></svg>', mustNotContain: 'onload' },
        { name: 'javascript: href', input: '<a href="javascript:alert(1)">click</a>', mustNotContain: 'javascript:' },
        // F9 — modern XSS vectors that the explicit FORBID_TAGS/FORBID_ATTR
        // lists don't cover, relying on DOMPurify defaults.
        { name: 'base href javascript', input: '<base href="javascript:alert(1)//">', mustNotContain: '<base' },
        { name: 'formaction on submit', input: '<form><button formaction="javascript:alert(1)">x</button></form>', mustNotContain: 'formaction' },
        { name: 'svg animate onbegin', input: '<svg><animate onbegin="alert(1)"/></svg>', mustNotContain: 'onbegin' },
        { name: 'svg use data: href', input: '<svg><use href="data:image/svg+xml;base64,PHN2Zw=="/></svg>', mustNotContain: 'data:image/svg' },
        { name: 'noscript mxss sandwich', input: '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></p></noscript>', mustNotContain: 'onerror' },
        { name: 'data: text/html href', input: '<a href="data:text/html,<script>alert(1)</script>">click</a>', mustNotContain: 'data:text/html' },
      ];

      test.each(xssPayloads)(
        'strips $name before persist',
        async ({ input, mustNotContain }) => {
          const caller = router.createCaller({ user: testUser });

          const { cleanup } = await addAndEnableUserSuperAdminMode({
            app,
            caller,
            userId: testUser.id,
          });
          onTestFinished(cleanup);

          // Some payloads (e.g. base-only, svg-only) reduce fully to empty
          // post-sanitize and trip the BANNER_INVALID_CONTENT guard. Wrap
          // them with a benign carrier so we can still assert the strip.
          const wrapped = `<p>ok</p>${input}`;

          await caller.banner.upsert({
            type: 'info',
            info: wrapped,
            active: true,
          });

          const [stored] = await databaseService.db
            .select()
            .from(bannerInfoTable);

          expect(stored.info).not.toContain(mustNotContain);
        }
      );

      test('preserves legitimate <a href="https://..."> links and injects rel="noopener noreferrer" on target=_blank', async () => {
        const caller = router.createCaller({ user: testUser });

        const { cleanup } = await addAndEnableUserSuperAdminMode({
          app,
          caller,
          userId: testUser.id,
        });
        onTestFinished(cleanup);

        await caller.banner.upsert({
          type: 'info',
          info: '<p>see <a href="https://example.com" target="_blank">docs</a></p>',
          active: true,
        });

        const [stored] = await databaseService.db
          .select()
          .from(bannerInfoTable);

        expect(stored.info).toContain('href="https://example.com"');
        expect(stored.info).toContain('target="_blank"');
        // F7: anti-tabnabbing — installSafeLinksHook must inject rel.
        expect(stored.info).toContain('rel="noopener noreferrer"');
      });

      test('rejects payload that DOMPurify reduces to empty (BANNER_INVALID_CONTENT → BAD_REQUEST)', async () => {
        const caller = router.createCaller({ user: testUser });

        const { cleanup } = await addAndEnableUserSuperAdminMode({
          app,
          caller,
          userId: testUser.id,
        });
        onTestFinished(cleanup);

        // F10 — pin the wire contract: TRPCError.code = BAD_REQUEST and the
        // message mentions the sanitization filter. Server-thrown
        // TRPCErrors expose `code` at the top level (not under `data`).
        await expect(
          caller.banner.upsert({
            type: 'info',
            info: '<script>alert(1)</script>',
            active: true,
          })
        ).rejects.toMatchObject({
          code: 'BAD_REQUEST',
          message: expect.stringMatching(/sanitization|filtré/i),
        });
      });
    });

    test('Deactivation persists the row and banner.get still returns it (active=false)', async () => {
      const caller = router.createCaller({ user: testUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: testUser.id,
      });
      onTestFinished(cleanup);

      await caller.banner.upsert({
        type: 'info',
        info: '<p>active</p>',
        active: true,
      });

      await caller.banner.upsert({
        type: 'info',
        info: '<p>active</p>',
        active: false,
      });

      // SUPER_ADMIN caller → real name on banner.get
      const fetched = await caller.banner.get();
      expect(fetched).toMatchObject({
        type: 'info',
        info: '<p>active</p>',
        active: false,
        modifiedAt: expect.any(String),
        modifiedByNom: expect.any(String),
      });
      expect(fetched?.modifiedByNom).not.toBe(SENTINEL);

      const rows = await databaseService.db.select().from(bannerInfoTable);
      expect(rows).toHaveLength(1);
      expect(rows[0].active).toBe(false);
    });

    test('Reactivating after deactivation reuses the singleton row (no zombie inserts)', async () => {
      const caller = router.createCaller({ user: testUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: testUser.id,
      });
      onTestFinished(cleanup);

      await caller.banner.upsert({
        type: 'info',
        info: '<p>draft</p>',
        active: false,
      });

      await caller.banner.upsert({
        type: 'warning',
        info: '<p>now live</p>',
        active: true,
      });

      const rows = await databaseService.db.select().from(bannerInfoTable);
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(1);
      expect(rows[0].active).toBe(true);
      expect(rows[0].type).toBe('warning');
    });

    test('Accepts empty info (e.g. cleared draft saved as inactive)', async () => {
      const caller = router.createCaller({ user: testUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: testUser.id,
      });
      onTestFinished(cleanup);

      const result = await caller.banner.upsert({
        type: 'info',
        info: '',
        active: false,
      });

      expect(result).toMatchObject({
        type: 'info',
        info: '',
        active: false,
        modifiedAt: expect.any(String),
        modifiedByNom: expect.any(String),
      });
      expect(result.modifiedByNom).not.toBe(SENTINEL);
    });

    test('Rejects payload exceeding max(50_000)', async () => {
      const caller = router.createCaller({ user: testUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: testUser.id,
      });
      onTestFinished(cleanup);

      const oversize = '<p>' + 'a'.repeat(50_001) + '</p>';

      await expect(
        caller.banner.upsert({
          type: 'info',
          info: oversize,
          active: true,
        })
      ).rejects.toThrow();
    });

    test('Rejects unknown type via zod', async () => {
      const caller = router.createCaller({ user: testUser });

      const { cleanup } = await addAndEnableUserSuperAdminMode({
        app,
        caller,
        userId: testUser.id,
      });
      onTestFinished(cleanup);

      await expect(
        caller.banner.upsert({
          // @ts-expect-error testing runtime validation
          type: 'unknown',
          info: '<p>x</p>',
          active: true,
        })
      ).rejects.toThrow();
    });
  });
});
