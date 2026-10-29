import { Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { PcaetModule } from '@tet/backend/demarches/pcaet/pcaet.module';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { ReferentielsModule } from '@tet/backend/referentiels/referentiels.module';
import { BuildMcpServerService } from './build-mcp-server.service';
import { McpDocsService } from './mcp-docs.service';
import { McpProtectedResourceMetadataController } from './mcp-protected-resource-metadata.controller';
import { McpResourceMetadataService } from './mcp-resource-metadata.service';
import { McpUnauthorizedFilter } from './mcp-unauthorized.filter';
import { McpController } from './mcp.controller';
import { MCP_TOOLS } from './mcp.constants';
import { DescribeTableService } from './tools/describe-table/describe-table.service';
import { FindUserRepository } from './tools/find-user/find-user.repository';
import { FindUserService } from './tools/find-user/find-user.service';
import { FindUserTool } from './tools/find-user/find-user.tool';
import { GetCollectiviteService } from './tools/get-collectivite/get-collectivite.service';
import { GetCollectiviteTool } from './tools/get-collectivite/get-collectivite.tool';
import { GetDemarchePcaetService } from './tools/get-demarche-pcaet/get-demarche-pcaet.service';
import { GetDemarchePcaetTool } from './tools/get-demarche-pcaet/get-demarche-pcaet.tool';
import { GetReferentielScoresService } from './tools/get-referentiel-scores/get-referentiel-scores.service';
import { GetReferentielScoresTool } from './tools/get-referentiel-scores/get-referentiel-scores.tool';
import { ListPlansActivityRepository } from './tools/list-plans/list-plans-activity.repository';
import { ListCollectivitePlansService } from './tools/list-plans/list-plans.service';
import { ListCollectivitePlansTool } from './tools/list-plans/list-plans.tool';
import { ListRecentEventsService } from './tools/list-recent-events/list-recent-events.service';
import { ListRecentEventsTool } from './tools/list-recent-events/list-recent-events.tool';
import { DescribeTableTool } from './tools/describe-table/describe-table.tool';
import { PosthogQueryClient } from './tools/run-hogql-query/posthog-query.client';
import { RunHogqlQueryService } from './tools/run-hogql-query/run-hogql-query.service';
import { RunHogqlQueryTool } from './tools/run-hogql-query/run-hogql-query.tool';
import { RunNamedQueryService } from './tools/run-named-query/run-named-query.service';
import { RunNamedQueryTool } from './tools/run-named-query/run-named-query.tool';
import { RunSqlQueryService } from './tools/run-sql-query/run-sql-query.service';
import { RunSqlQueryTool } from './tools/run-sql-query/run-sql-query.tool';
import { CollectiviteAccessService } from './tools/shared/collectivite-access.service';

const toolClasses = [
  // Analytique (base de l'équipe data, PostHog)
  RunSqlQueryTool,
  RunNamedQueryTool,
  DescribeTableTool,
  RunHogqlQueryTool,
  // Métier, par collectivité ou utilisateur, avec les permissions de l'app
  GetCollectiviteTool,
  ListCollectivitePlansTool,
  GetDemarchePcaetTool,
  GetReferentielScoresTool,
  FindUserTool,
  ListRecentEventsTool,
];

@Module({
  imports: [CollectivitesModule, PlanModule, PcaetModule, ReferentielsModule],
  controllers: [McpController, McpProtectedResourceMetadataController],
  providers: [
    BuildMcpServerService,
    McpDocsService,
    McpResourceMetadataService,
    McpUnauthorizedFilter,
    RunSqlQueryService,
    DescribeTableService,
    PosthogQueryClient,
    RunHogqlQueryService,
    RunNamedQueryService,
    CollectiviteAccessService,
    FindUserRepository,
    FindUserService,
    GetCollectiviteService,
    ListPlansActivityRepository,
    ListCollectivitePlansService,
    GetDemarchePcaetService,
    GetReferentielScoresService,
    ListRecentEventsService,
    ...toolClasses,
    {
      provide: MCP_TOOLS,
      useFactory: (...tools: unknown[]) => tools,
      inject: toolClasses,
    },
  ],
})
export class McpModule {}
