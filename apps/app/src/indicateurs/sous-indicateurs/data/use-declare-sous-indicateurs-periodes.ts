import { useCollectiviteId } from '@tet/api/collectivites';
import {
  useDeclareIndicateursPeriodes,
  type DeclareIndicateursPeriodes,
} from '../../valeurs/use-declare-indicateur-periodes';

export const useDeclareSousIndicateursPeriodes =
  (): DeclareIndicateursPeriodes =>
    useDeclareIndicateursPeriodes(useCollectiviteId());
