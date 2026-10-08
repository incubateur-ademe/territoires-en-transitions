import { Injectable } from '@nestjs/common';
import { type Result } from '@tet/backend/utils/result.type';
import {
  ActionDeReference,
  GetActionDeReferenceInput,
} from '@tet/domain/shared';
import { GetActionDeReferenceError } from '../actions-de-reference.errors';
import { ActionsDeReferenceRepository } from '../actions-de-reference.repository';

type GetActionDeReference = (
  input: GetActionDeReferenceInput
) => Promise<Result<ActionDeReference, GetActionDeReferenceError>>;

@Injectable()
export class GetActionDeReferenceService {
  constructor(private readonly repository: ActionsDeReferenceRepository) {}

  getAction: GetActionDeReference = (input) => this.repository.get(input);
}
