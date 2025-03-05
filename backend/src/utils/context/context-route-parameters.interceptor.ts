import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { ContextStoreService } from './context.service';

@Injectable()
export class ContextRouteParametersInterceptor implements NestInterceptor {
  constructor(private readonly contextStoreService: ContextStoreService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    this.contextStoreService.autoSetContextFromPayload(req.params);
    this.contextStoreService.autoSetContextFromPayload(req.query);

    return next.handle();
  }
}
