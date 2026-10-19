import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  context,
  propagation,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import { NodeSDK, NodeSDKConfiguration } from '@opentelemetry/sdk-node';
import { defer } from 'rxjs';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NestTelemetryInterceptor, traceNestBootstrap } from './nest-telemetry';

type SpanProcessor = NonNullable<
  NodeSDKConfiguration['spanProcessors']
>[number];
type FinishedSpan = Parameters<SpanProcessor['onEnd']>[0];

@Controller('telemetry')
class TelemetryController {
  @Get('async')
  async getAsync() {
    const before = trace.getActiveSpan()?.spanContext().spanId;
    await Promise.resolve();
    return { before, after: trace.getActiveSpan()?.spanContext().spanId };
  }

  @Get('observable')
  getObservable() {
    return defer(async () => {
      await Promise.resolve();
      return { spanId: trace.getActiveSpan()?.spanContext().spanId };
    });
  }

  @Get('error')
  async getError() {
    await Promise.resolve();
    throw new Error('Controller failed');
  }
}

describe('Nest telemetry', () => {
  let app: INestApplication;
  let sdk: NodeSDK;
  const spans: FinishedSpan[] = [];

  beforeAll(async () => {
    const processor: SpanProcessor = {
      onStart() {},
      onEnd(span) {
        spans.push(span);
      },
      async shutdown() {},
      async forceFlush() {},
    };
    sdk = new NodeSDK({
      autoDetectResources: false,
      instrumentations: [],
      logRecordProcessors: [],
      metricReaders: [],
      spanProcessors: [processor],
      sampler: {
        shouldSample: () => ({ decision: 2 }),
        toString: () => 'AlwaysSample',
      },
    });
    sdk.start();

    const module = await Test.createTestingModule({
      controllers: [TelemetryController],
    }).compile();
    app = module.createNestApplication({ logger: false });
    app.useGlobalInterceptors(new NestTelemetryInterceptor());
    await app.init();
  });

  beforeEach(() => {
    spans.length = 0;
  });

  afterAll(async () => {
    await app?.close();
    await sdk?.shutdown();
    trace.disable();
    context.disable();
    propagation.disable();
  });

  it('keeps the controller span active across asynchronous work', async () => {
    const response = await request(app.getHttpServer())
      .get('/telemetry/async')
      .expect(200);

    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('TelemetryController.getAsync');
    expect(response.body).toEqual({
      before: spans[0].spanContext().spanId,
      after: spans[0].spanContext().spanId,
    });
    expect(spans[0].attributes).toMatchObject({
      'nestjs.controller': 'TelemetryController',
      'nestjs.callback': 'getAsync',
      'http.request.method': 'GET',
      'http.route': '/telemetry/async',
    });
  });

  it('traces an Observable until its asynchronous work finishes', async () => {
    const response = await request(app.getHttpServer())
      .get('/telemetry/observable')
      .expect(200);

    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('TelemetryController.getObservable');
    expect(response.body.spanId).toBe(spans[0].spanContext().spanId);
  });

  it('records controller errors and closes their span', async () => {
    await request(app.getHttpServer()).get('/telemetry/error').expect(500);

    expect(spans).toHaveLength(1);
    expect(spans[0].status).toEqual({
      code: SpanStatusCode.ERROR,
      message: 'Controller failed',
    });
    expect(spans[0].events).toEqual([
      expect.objectContaining({
        name: 'exception',
        attributes: expect.objectContaining({
          'exception.message': 'Controller failed',
        }),
      }),
    ]);
  });

  it('traces application creation and returns its result', async () => {
    const result = await traceNestBootstrap('TestModule', async () => {
      await Promise.resolve();
      return trace.getActiveSpan()?.spanContext().spanId;
    });

    expect(spans).toHaveLength(1);
    expect(spans[0].name).toBe('Create Nest App');
    expect(spans[0].attributes['nestjs.module']).toBe('TestModule');
    expect(result).toBe(spans[0].spanContext().spanId);
  });

  it('records startup failures and preserves the thrown error', async () => {
    const error = new Error('Startup failed');
    await expect(
      traceNestBootstrap('TestModule', async () => {
        throw error;
      })
    ).rejects.toBe(error);

    expect(spans).toHaveLength(1);
    expect(spans[0].status.code).toBe(SpanStatusCode.ERROR);
    expect(spans[0].events[0].attributes?.['exception.message']).toBe(
      'Startup failed'
    );
  });
});
