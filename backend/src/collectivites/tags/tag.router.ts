import { Injectable } from '@nestjs/common';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { PersonneTagRouter } from '@/backend/collectivites/tags/personnes/personne-tag.router';

@Injectable()
export class TagRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly personne : PersonneTagRouter
  ) {}

  router = this.trpc.router({
      personnes: this.personne.router,
  });
}
