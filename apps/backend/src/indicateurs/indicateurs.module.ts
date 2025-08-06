import { IndicateurDefinitionPiloteRouter } from '@/backend/indicateurs/definitions/handle-definition-pilote/indicateur-definition-pilote.router';
import { IndicateurDefinitionPiloteService } from '@/backend/indicateurs/definitions/handle-definition-pilote/indicateur-definition-pilote.service';
import { IndicateurDefinitionServiceTagRouter } from '@/backend/indicateurs/definitions/handle-definition-service-tag/indicateur-definition-service-tag.router';
import { IndicateurDefinitionServiceTagService } from '@/backend/indicateurs/definitions/handle-definition-service-tag/indicateur-definition-service-tag.service';
import { IndicateurDefinitionThematiqueRouter } from '@/backend/indicateurs/definitions/handle-definition-thematique/indicateur-definition-thematique.router';
import { IndicateurDefinitionThematiqueService } from '@/backend/indicateurs/definitions/handle-definition-thematique/indicateur-definition-thematique.service';
import { UpdateIndicateurRouter } from '@/backend/indicateurs/definitions/update-indicateur-definition.router';
import { UpdateIndicateurDefinitionService } from '@/backend/indicateurs/definitions/update-indicateur-definition.service';
import { IndicateursRouter } from '@/backend/indicateurs/indicateurs.router';
import CreateIndicateurPersoService from '@/backend/indicateurs/list-definitions/create-indicateur-perso.service';
import { IndicateursListDefinitionsController } from '@/backend/indicateurs/list-definitions/list-definitions.controller';
import ComputeValeursService from '@/backend/indicateurs/valeurs/compute-valeurs.service';
import IndicateurExpressionService from '@/backend/indicateurs/valeurs/indicateur-expression.service';
import { Module } from '@nestjs/common';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import PersonnalisationsExpressionService from '../personnalisations/services/personnalisations-expression.service';
import PersonnalisationsService from '../personnalisations/services/personnalisations-service';
import { AuthModule } from '../users/auth.module';
import { SheetModule } from '../utils/google-sheets/sheet.module';
import { ListIndicateursRouter } from './definitions/list-indicateurs.router';
import ListIndicateursService from './definitions/list-indicateurs.service';
import { ExportIndicateursController } from './export-indicateurs/export-indicateurs.controller';
import ExportIndicateursService from './export-indicateurs/export-indicateurs.service';
import { ImportIndicateurDefinitionController } from './import-indicateurs/import-indicateur-definition.controller';
import ImportIndicateurDefinitionService from './import-indicateurs/import-indicateur-definition.service';
import { IndicateurDefinitionsRouter } from './list-definitions/list-definitions.router';
import { ListDefinitionsService } from './list-definitions/list-definitions.service';
import { IndicateurSourcesRouter } from './sources/indicateur-sources.router';
import IndicateurSourcesService from './sources/indicateur-sources.service';
import TrajectoiresDataService from './trajectoires/trajectoires-data.service';
import TrajectoiresSpreadsheetService from './trajectoires/trajectoires-spreadsheet.service';
import TrajectoiresXlsxService from './trajectoires/trajectoires-xlsx.service';
import { TrajectoiresController } from './trajectoires/trajectoires.controller';
import { TrajectoiresRouter } from './trajectoires/trajectoires.router';
import { IndicateursValeursController } from './valeurs/crud-valeurs.controller';
import { IndicateurValeursRouter } from './valeurs/crud-valeurs.router';
import CrudValeursService from './valeurs/crud-valeurs.service';
import ValeursMoyenneService from './valeurs/valeurs-moyenne.service';
import ValeursReferenceService from './valeurs/valeurs-reference.service';

@Module({
  imports: [AuthModule, CollectivitesModule, SheetModule],
  providers: [
    ExportIndicateursService,
    IndicateurSourcesService,
    ListDefinitionsService,
    IndicateurDefinitionsRouter,
    IndicateurSourcesService,
    IndicateurExpressionService,
    CrudValeursService,
    ImportIndicateurDefinitionService,
    ValeursMoyenneService,
    ValeursReferenceService,
    ListIndicateursService,
    ListIndicateursRouter,
    IndicateurValeursRouter,
    IndicateurSourcesRouter,
    TrajectoiresDataService,
    TrajectoiresSpreadsheetService,
    TrajectoiresXlsxService,
    TrajectoiresRouter,
    PersonnalisationsService,
    PersonnalisationsExpressionService,
    ComputeValeursService,
    CreateIndicateurPersoService,
    UpdateIndicateurDefinitionService,
    UpdateIndicateurRouter,
    IndicateursRouter,
    IndicateurDefinitionPiloteRouter,
    IndicateurDefinitionPiloteService,
    IndicateurDefinitionServiceTagRouter,
    IndicateurDefinitionServiceTagService,
    IndicateurDefinitionThematiqueRouter,
    IndicateurDefinitionThematiqueService
  ],
  exports: [
    IndicateurSourcesService,
    ListDefinitionsService,
    IndicateurExpressionService,
    IndicateurDefinitionsRouter,
    IndicateurSourcesRouter,
    CrudValeursService,
    ValeursMoyenneService,
    ValeursReferenceService,
    TrajectoiresRouter,
    ListIndicateursService,
    ListIndicateursRouter,
    IndicateurValeursRouter,
    UpdateIndicateurDefinitionService,
    IndicateursRouter,
    IndicateurDefinitionPiloteRouter,
    IndicateurDefinitionPiloteService,
    IndicateurDefinitionServiceTagRouter,
    IndicateurDefinitionServiceTagService,
    IndicateurDefinitionThematiqueRouter,
    IndicateurDefinitionThematiqueService
  ],
  controllers: [
    IndicateursValeursController,
    IndicateursListDefinitionsController,
    ImportIndicateurDefinitionController,
    ExportIndicateursController,
    TrajectoiresController,
  ],
})
export class IndicateursModule { }
