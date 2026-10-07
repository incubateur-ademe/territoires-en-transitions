import { Injectable } from '@nestjs/common';
import { type Result } from '@tet/backend/utils/result.type';
import {
  ActionDeReference,
  ListActionsDeReferenceInput,
} from '@tet/domain/shared';
import { ListActionsDeReferenceError } from '../actions-de-reference.errors';
import { ActionsDeReferenceRepository } from '../actions-de-reference.repository';

type ListActionsDeReference = (
  input: ListActionsDeReferenceInput
) => Promise<Result<ActionDeReference[], ListActionsDeReferenceError>>;

@Injectable()
export class ListActionsDeReferenceService {
  constructor(private readonly repository: ActionsDeReferenceRepository) {}

  listActions: ListActionsDeReference = (input) => this.repository.list(input);
}
