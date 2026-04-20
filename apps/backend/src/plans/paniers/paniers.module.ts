import { forwardRef, Module } from '@nestjs/common';
import { CollectivitesModule } from '@tet/backend/collectivites/collectivites.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { FichesModule } from '../fiches/fiches.module';
import { PlanModule } from '../plans/plans.module';
import { CheckoutRouter } from './checkout/checkout.router';
import { CheckoutService } from './checkout/checkout.service';
import { PanierCheckoutRepository } from './checkout/panier-checkout.repository';
import { PaniersRouter } from './paniers.router';

@Module({
  imports: [
    forwardRef(() => CollectivitesModule),
    forwardRef(() => FichesModule),
    forwardRef(() => PlanModule),
    TransactionModule,
  ],
  providers: [
    PanierCheckoutRepository,
    CheckoutService,
    CheckoutRouter,
    PaniersRouter,
  ],
  exports: [PaniersRouter],
})
export class PaniersModule {}
