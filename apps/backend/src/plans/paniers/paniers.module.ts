import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { FichesModule } from '../fiches/fiches.module';
import { PlanModule } from '../plans/plans.module';
import { PanierActionsRepository } from './actions/actions.repository';
import { PanierActionsRouter } from './actions/actions.router';
import { PanierActionsService } from './actions/actions.service';
import { CheckoutRouter } from './checkout/checkout.router';
import { CheckoutService } from './checkout/checkout.service';
import { PanierCheckoutRepository } from './checkout/panier-checkout.repository';
import { PaniersRouter } from './paniers.router';
import { PanierRepository } from './shared/panier.repository';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    forwardRef(() => FichesModule),
    forwardRef(() => PlanModule),
    TransactionModule,
  ],
  providers: [
    PanierRepository,
    PanierCheckoutRepository,
    CheckoutService,
    CheckoutRouter,
    PanierActionsRepository,
    PanierActionsService,
    PanierActionsRouter,
    PaniersRouter,
  ],
  exports: [PaniersRouter],
})
export class PaniersModule {}
