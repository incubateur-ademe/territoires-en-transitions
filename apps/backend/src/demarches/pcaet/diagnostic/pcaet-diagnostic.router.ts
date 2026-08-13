import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { AddVulnerabiliteDomaineRouter } from '../add-vulnerabilite-domaine/add-vulnerabilite-domaine.router';
import { GetDiagnosticRouter } from '../get-diagnostic/get-diagnostic.router';
import { RemoveVulnerabiliteDomaineRouter } from '../remove-vulnerabilite-domaine/remove-vulnerabilite-domaine.router';
import { SetDiagnosticYearsRouter } from '../set-diagnostic-years/set-diagnostic-years.router';
import { SetVulnerabiliteLigneRouter } from '../set-vulnerabilite-ligne/set-vulnerabilite-ligne.router';
import { UpdateVulnerabiliteDomaineRouter } from '../update-vulnerabilite-domaine/update-vulnerabilite-domaine.router';

@Injectable()
export class PcaetDiagnosticRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDiagnosticRouter: GetDiagnosticRouter,
    private readonly setDiagnosticYearsRouter: SetDiagnosticYearsRouter,
    private readonly setVulnerabiliteLigneRouter: SetVulnerabiliteLigneRouter,
    private readonly addVulnerabiliteDomaineRouter: AddVulnerabiliteDomaineRouter,
    private readonly updateVulnerabiliteDomaineRouter: UpdateVulnerabiliteDomaineRouter,
    private readonly removeVulnerabiliteDomaineRouter: RemoveVulnerabiliteDomaineRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.getDiagnosticRouter.router,
    this.setDiagnosticYearsRouter.router,
    this.setVulnerabiliteLigneRouter.router,
    this.addVulnerabiliteDomaineRouter.router,
    this.updateVulnerabiliteDomaineRouter.router,
    this.removeVulnerabiliteDomaineRouter.router
  );
}
