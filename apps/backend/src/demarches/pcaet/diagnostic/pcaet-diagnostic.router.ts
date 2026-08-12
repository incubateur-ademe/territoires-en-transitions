import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { GetDiagnosticRouter } from '../get-diagnostic/get-diagnostic.router';
import { SetDiagnosticYearsRouter } from '../set-diagnostic-years/set-diagnostic-years.router';

@Injectable()
export class PcaetDiagnosticRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDiagnosticRouter: GetDiagnosticRouter,
    private readonly setDiagnosticYearsRouter: SetDiagnosticYearsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.getDiagnosticRouter.router,
    this.setDiagnosticYearsRouter.router
  );
}
