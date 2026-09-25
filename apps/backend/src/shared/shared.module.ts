import { Module } from '@nestjs/common';
import { SendContactMessageRouter } from '@tet/backend/shared/contact/send-contact-message.router';
import { SendContactMessageService } from '@tet/backend/shared/contact/send-contact-message.service';
import { DepartementService } from '@tet/backend/shared/departements/departement.service';
import { EffetAttenduService } from '@tet/backend/shared/effet-attendu/effet-attendu.service';
import { RegionService } from '@tet/backend/shared/regions/region.service';
import { SharedRouter } from '@tet/backend/shared/shared.router';
import { TempsDeMiseEnOeuvreService } from '@tet/backend/shared/temps-de-mise-en-oeuvre/temps-de-mise-en-oeuvre.service';
import { ThematiqueService } from '@tet/backend/shared/thematiques/thematique.service';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';

@Module({
  // NotificationsModule pour EmailService, utilisé par le formulaire de contact.
  imports: [NotificationsModule],
  providers: [
    ThematiqueService,
    RegionService,
    DepartementService,
    EffetAttenduService,
    TempsDeMiseEnOeuvreService,
    SendContactMessageService,
    SendContactMessageRouter,
    SharedRouter,
  ],
  exports: [SharedRouter],
})
export class SharedModule {}
