import { RouterInput } from '@tet/api';
import { FicheWithRelationsAndCollectivite } from '@tet/domain/plans';

export type ActionGenericCellProps = {
  action: FicheWithRelationsAndCollectivite;
  canUpdate?: boolean;
  updateAction: (input: RouterInput['plans']['fiches']['update']) => void;
};
