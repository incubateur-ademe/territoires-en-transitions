import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { createdByNom, dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  BannerGetOutput,
  BannerOutput,
  installSafeLinksHook,
  SAFE_HTML_CONFIG,
  UpsertBannerInput,
} from '@tet/domain/utils';
import {
  PermissionOperationEnum,
  ResourceType,
} from '@tet/domain/users';
import createDOMPurify from 'dompurify';
import { eq, sql, SQL } from 'drizzle-orm';
import { JSDOM } from 'jsdom';
import { bannerInfoTable } from './banner-info.table';
import type { BannerError } from './banner.error';

const SINGLETON_ID = 1;

/**
 * Sentinel emitted in place of the modifier's identity when the caller does
 * not hold `utils.banner.mutate`. The widget mounts globally; without
 * gating, every authed user would see the SUPER_ADMIN team's prenom + nom.
 * Callers who can mutate the banner (i.e., support staff in super-admin
 * mode) see the real `createdByNom` value instead.
 */
const MODIFIED_BY_SENTINEL = 'Équipe support';

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);
  private readonly purify = (() => {
    const instance = createDOMPurify(new JSDOM('').window);
    installSafeLinksHook(instance);
    return instance;
  })();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Build the banner projection. When `revealIdentity` is true, the
   * `modifiedByNom` field carries the real `createdByNom` SQL helper
   * (joined against `dcpTable`); otherwise it carries the static sentinel.
   */
  private projection(revealIdentity: boolean) {
    const modifiedByNomExpr: SQL<string> = revealIdentity
      ? createdByNom
      : sql<string>`${MODIFIED_BY_SENTINEL}`;

    return {
      type: bannerInfoTable.type,
      info: bannerInfoTable.info,
      active: bannerInfoTable.active,
      modifiedAt: bannerInfoTable.modifiedAt,
      modifiedByNom: modifiedByNomExpr,
    } as const;
  }

  private async canMutateBanner(user: AuthenticatedUser): Promise<boolean> {
    return this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['UTILS.BANNER.MUTATE'],
      ResourceType.PLATEFORME,
      null,
      true // doNotThrow — caller decides how to react
    );
  }

  /**
   * Returns the singleton banner row, or null if the table is empty.
   * Returning the row regardless of `active` keeps the support edit page
   * able to display the persisted draft; the public widget filters
   * inactive content client-side.
   *
   * `modifiedByNom` is gated: callers with `utils.banner.mutate` see the
   * real modifier name; everyone else sees the sentinel.
   */
  async get(user: AuthenticatedUser): Promise<BannerGetOutput> {
    const revealIdentity = await this.canMutateBanner(user);
    const projection = this.projection(revealIdentity);

    const rows = await this.databaseService.db
      .select(projection)
      .from(bannerInfoTable)
      .leftJoin(dcpTable, eq(dcpTable.id, bannerInfoTable.modifiedBy))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Creates or updates the singleton banner row atomically via INSERT … ON
   * CONFLICT (id) DO UPDATE. The fixed PK (id = 1, enforced by CHECK) makes
   * the upsert a single statement: no SELECT-then-write race, no zombie
   * rows. Requires the `utils.banner.mutate` permission; sanitizes HTML
   * server-side as defense-in-depth with the client-side DOMPurify pass.
   */
  async upsert(
    input: UpsertBannerInput,
    user: AuthenticatedUser
  ): Promise<Result<BannerOutput, BannerError>> {
    try {
      if (!(await this.canMutateBanner(user))) {
        return failure('BANNER_NOT_AUTHORIZED');
      }

      const safeInfo = this.purify.sanitize(input.info, SAFE_HTML_CONFIG);

      // Reject script-only payloads that DOMPurify reduces fully to empty.
      // A legit "clear my draft" save sends input.info='' and bypasses this
      // check (length === 0 && length === 0 → false).
      if (input.info.length > 0 && safeInfo.length === 0) {
        return failure('BANNER_INVALID_CONTENT');
      }

      const writeValues = {
        id: SINGLETON_ID,
        type: input.type,
        info: safeInfo,
        active: input.active,
        modifiedAt: new Date().toISOString(),
        modifiedBy: user.id,
      };

      // Atomic singleton upsert. The fixed PK (CHECK id = 1, DEFAULT 1)
      // makes ON CONFLICT (id) DO UPDATE the exhaustive concurrency
      // strategy — no race window, no phantom rows.
      await this.databaseService.db
        .insert(bannerInfoTable)
        .values(writeValues)
        .onConflictDoUpdate({
          target: bannerInfoTable.id,
          set: {
            type: writeValues.type,
            info: writeValues.info,
            active: writeValues.active,
            modifiedAt: writeValues.modifiedAt,
            modifiedBy: writeValues.modifiedBy,
          },
        });

      // Re-select with the projection. The caller just authorized
      // themselves to write, so they can see the real modifier name.
      const [row] = await this.databaseService.db
        .select(this.projection(true))
        .from(bannerInfoTable)
        .leftJoin(dcpTable, eq(dcpTable.id, bannerInfoTable.modifiedBy))
        .limit(1);

      return success(row);
    } catch (error) {
      this.logger.error(
        `Banner upsert failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return failure('BANNER_DATABASE_ERROR');
    }
  }
}
