import {useEpciId} from 'core-logic/hooks/params';
import {EpciStorable} from 'storables/EpciStorable';
import {useStorable} from 'core-logic/hooks/storables';
import {epciStore} from 'core-logic/api/hybridStores';

export function useCurrentEpci(): EpciStorable | null {
  const epciId = useEpciId();
  const epci = useStorable<EpciStorable>(epciId ?? '', epciStore);
  return epci;
}
