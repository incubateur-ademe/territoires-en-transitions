import { Injectable } from '@nestjs/common';
import { TrpcService } from '../trpc/trpc.service';
import {
  listRequestSchema,
  PersonnesService,
} from './services/personnes.service';

const inputSchema = listRequestSchema;

@Injectable()
export class PersonnesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: PersonnesService
  ) {}

  router = this.trpc.router({
    list: this.trpc.authedProcedure.input(inputSchema).query(({ input }) => {
      return this.service.list(input);
    }),
  });
}
