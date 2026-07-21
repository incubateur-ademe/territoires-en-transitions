// Nom du profile enregistré correspondant à la stack up : égalité stricte
// entre l'ensemble des services running (hors one-shots) et le snapshot du
// profile. La lecture des profiles est injectée (readProfiles), au même titre
// que stack/resolver — le hook ne connaît pas la couche de stockage ; relue à
// chaque poll (le thunk peut renvoyer une valeur fraîche après une sauvegarde
// ou un make up).
import { useMemo } from 'react';
import { matchProfileName } from '../../stack-profiles.mts';
import type { StackProfiles } from '../../stack-profiles.mts';
import { runningServiceNames } from '../stack-service/index.mts';
import type { StackService } from '../stack-service/index.mts';

export const useProfileName = (
  services: StackService[],
  readProfiles: () => StackProfiles
): string | null =>
  useMemo(() => {
    const running = runningServiceNames(services);
    if (!running.length) return null;
    return matchProfileName(readProfiles(), running);
  }, [services, readProfiles]);
