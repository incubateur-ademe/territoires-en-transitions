import { Injectable } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { notImplemented } from '@tet/backend/utils/not-implemented';
import { type Result } from '@tet/backend/utils/result.type';
import {
  UpdateActionDeReferenceInput,
  UpdateActionDeReferenceOutput,
} from '@tet/domain/shared';
import { UpdateActionDeReferenceError } from '../actions-de-reference.errors';

type UpdateActionDeReference = (
  input: UpdateActionDeReferenceInput,
  secondArg: ServiceSecondArg
) => Promise<
  Result<UpdateActionDeReferenceOutput, UpdateActionDeReferenceError>
>;

@Injectable()
export class UpdateActionDeReferenceService {
  updateAction: UpdateActionDeReference = notImplemented('updateAction');
}
