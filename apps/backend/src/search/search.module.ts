import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesCoreModule } from '@tet/backend/collectivites/collectivites-core.module';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { ReferentielsModule } from '@tet/backend/referentiels/referentiels.module';
import { TrpcModule } from '@tet/backend/utils/trpc/trpc.module';
import { UsersModule } from '@tet/backend/users/users.module';
import { SearchAdminRouter } from './search-admin.router';
import { SearchAdminService } from './search-admin.service';
import { SearchRouter } from './search.router';
import { SearchService } from './search.service';

/**
 * Module exposant le proxy de lecture (`search.query`, U7) ET les procédures
 * admin de réindexation (`search.admin.*`, U8).
 *
 * - `CollectivitesCoreModule` fournit `CollectivitesService.isPrivate`, utilisé
 *   par le proxy de lecture pour résoudre la permission requise (READ vs
 *   READ_CONFIDENTIEL).
 * - `UsersModule` fournit `PermissionService` (gating COLLECTIVITES.MUTATE
 *   sur `ResourceType.PLATEFORME` côté admin, et READ côté lecture).
 * - `TrpcModule` fournit `TrpcService` pour la forme du router.
 * - `SearchIndexerModule` est `@Global()` et n'a donc pas besoin d'être
 *   importé explicitement.
 *
 * Pour le sous-routeur admin (U8), `SearchAdminService` injecte les cinq
 * indexeurs par domaine. Chacun est exporté par le module de son domaine ;
 * on les importe ici via `forwardRef` quand le graphe contient des cycles
 * (ex. `CollectivitesModule` ↔ `CollectivitesCoreModule`). Si pas de cycle,
 * un import direct suffit.
 *
 * `SearchRouter` est exporté pour que le top-level `TrpcRouter` le câble
 * sous la clé `search:`.
 */
@Module({
  imports: [
    // `CollectivitesCoreModule` est importé pour `CollectivitesService`
    // (utilisé par `SearchService` côté lecture U7). `CollectivitesModule`
    // (importé plus bas en `forwardRef`) le ré-exporte mais on le garde
    // explicite pour rendre la dépendance lisible.
    CollectivitesCoreModule,
    UsersModule,
    TrpcModule,
    forwardRef(() => PlanModule),
    forwardRef(() => FichesModule),
    forwardRef(() => IndicateursModule),
    forwardRef(() => ReferentielsModule),
    forwardRef(() => CollectivitesModule),
  ],
  providers: [SearchService, SearchRouter, SearchAdminService, SearchAdminRouter],
  exports: [SearchRouter],
})
export class SearchModule {}
