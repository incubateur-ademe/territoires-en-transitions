import { Module } from '@nestjs/common';
import { BuildMcpServerService } from './build-mcp-server.service';
import { McpDocsService } from './mcp-docs.service';
import { McpProtectedResourceMetadataController } from './mcp-protected-resource-metadata.controller';
import { McpResourceMetadataService } from './mcp-resource-metadata.service';
import { McpUnauthorizedFilter } from './mcp-unauthorized.filter';
import { McpController } from './mcp.controller';
import { MCP_TOOLS } from './mcp.constants';
import { DescribeTableService } from './tools/describe-table/describe-table.service';
import { DescribeTableTool } from './tools/describe-table/describe-table.tool';
import { PosthogQueryClient } from './tools/run-hogql-query/posthog-query.client';
import { RunHogqlQueryService } from './tools/run-hogql-query/run-hogql-query.service';
import { RunHogqlQueryTool } from './tools/run-hogql-query/run-hogql-query.tool';
import { RunSqlQueryService } from './tools/run-sql-query/run-sql-query.service';
import { RunSqlQueryTool } from './tools/run-sql-query/run-sql-query.tool';

const toolClasses = [RunSqlQueryTool, DescribeTableTool, RunHogqlQueryTool];

@Module({
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
    ...toolClasses,
    {
      provide: MCP_TOOLS,
      useFactory: (...tools: unknown[]) => tools,
      inject: toolClasses,
    },
  ],
})
export class McpModule {}
