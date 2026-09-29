import { Injectable } from '@nestjs/common';
import { notImplemented } from '@tet/backend/utils/not-implemented';
import { type Result } from '@tet/backend/utils/result.type';
import {
  ActionDeReference,
  ListActionsDeReferenceInput,
} from '@tet/domain/shared';
import { ListActionsDeReferenceError } from '../actions-de-reference.errors';

type ListActionsDeReference = (
  input: ListActionsDeReferenceInput
) => Promise<Result<ActionDeReference[], ListActionsDeReferenceError>>;

@Injectable()
export class ListActionsDeReferenceService {
  listActions: ListActionsDeReference = notImplemented('listActions');
}
