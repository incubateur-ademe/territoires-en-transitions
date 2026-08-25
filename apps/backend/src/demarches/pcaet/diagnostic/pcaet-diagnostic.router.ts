import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { AddVulnerabiliteThematiqueRouter } from '../add-vulnerabilite-thematique/add-vulnerabilite-thematique.router';
import { GetDiagnosticRouter } from '../get-diagnostic/get-diagnostic.router';
import { RemoveVulnerabiliteThematiqueRouter } from '../remove-vulnerabilite-thematique/remove-vulnerabilite-thematique.router';
import { SetDiagnosticYearsRouter } from '../set-diagnostic-years/set-diagnostic-years.router';
import { SetVulnerabiliteLigneRouter } from '../set-vulnerabilite-ligne/set-vulnerabilite-ligne.router';
import { UpdateVulnerabiliteThematiqueRouter } from '../update-vulnerabilite-thematique/update-vulnerabilite-thematique.router';
import { UpdateDiagnosticIndicateursValeursRouter } from './update-diagnostic-indicateurs-valeurs/update-diagnostic-indicateurs-valeurs.router';

@Injectable()
export class PcaetDiagnosticRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getDiagnosticRouter: GetDiagnosticRouter,
    private readonly setDiagnosticYearsRouter: SetDiagnosticYearsRouter,
    private readonly setVulnerabiliteLigneRouter: SetVulnerabiliteLigneRouter,
    private readonly addVulnerabiliteThematiqueRouter: AddVulnerabiliteThematiqueRouter,
    private readonly updateVulnerabiliteThematiqueRouter: UpdateVulnerabiliteThematiqueRouter,
    private readonly removeVulnerabiliteThematiqueRouter: RemoveVulnerabiliteThematiqueRouter,
    private readonly updateDiagnosticIndicateursValeursRouter: UpdateDiagnosticIndicateursValeursRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.getDiagnosticRouter.router,
    this.setDiagnosticYearsRouter.router,
    this.setVulnerabiliteLigneRouter.router,
    this.addVulnerabiliteThematiqueRouter.router,
    this.updateVulnerabiliteThematiqueRouter.router,
    this.removeVulnerabiliteThematiqueRouter.router,
    this.updateDiagnosticIndicateursValeursRouter.router
  );
}
