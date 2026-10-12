import { makeCollectiviteActionUrl } from '@/app/app/paths';
import type { ActionDeReferenceFiche } from './actions-de-reference.contract';

const toFicheLink = ({
  id,
  collectiviteId,
  restreint,
}: Pick<ActionDeReferenceFiche, 'id' | 'collectiviteId' | 'restreint'>):
  | string
  | undefined => {
  if (restreint === true) {
    return undefined;
  }
  return makeCollectiviteActionUrl({
    collectiviteId,
    ficheUid: id.toString(),
  });
};

export { toFicheLink };
