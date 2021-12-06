import {useEpciSiren} from 'core-logic/hooks/params';
import {EpciStorable} from 'storables/EpciStorable';
import {useStorable} from 'core-logic/hooks/storables';
import {epciStore} from 'core-logic/api/hybridStores';

export const useCurrentEpci = (): EpciStorable | null => {
  const epciSiren = useEpciSiren();
  return useStorable<EpciStorable>(epciSiren ?? '', epciStore);
};
