import { Global, Module } from '@nestjs/common';
import { SearchIndexerService } from './search-indexer.service';

/**
 * Module global exposant `SearchIndexerService` à l'ensemble du backend.
 *
 * Le service est volontairement *thin* (pas de connaissance métier) : c'est
 * l'enveloppe partagée par tous les indexeurs par domaine (`PlanIndexerService`,
 * `FicheIndexerService`, `IndicateurIndexerService`, `ActionIndexerService`,
 * `DocumentIndexerService`) ainsi que par le proxy de lecture (U7).
 *
 * `@Global()` évite à chaque module domaine d'importer explicitement
 * `SearchIndexerModule` — même convention que `UtilsModule` pour
 * `WebhookService`. `ConfigurationModule` étant lui aussi global, il n'a pas
 * besoin d'être importé ici pour que `ConfigurationService` soit injectable.
 */
@Global()
@Module({
  providers: [SearchIndexerService],
  exports: [SearchIndexerService],
})
export class SearchIndexerModule {}
