import { CollectiviteRole } from '@tet/domain/users';
import { getAccessLevelLabel } from './permission-access-level.utils';
import { useIsAccessEditionFichesIndicateursEnabled } from './use-is-access-edition-fiches-indicateurs-enabled';

type UseAccessLevelsProps = {
  allowAdmin?: boolean;
};

export const useAccessLevels = (props: UseAccessLevelsProps) => {
  const { allowAdmin } = props;

  const isAccessEditionFichesIndicateursEnabled =
    useIsAccessEditionFichesIndicateursEnabled();

  const accessLevels: {
    isVisible: boolean;
    value: CollectiviteRole;
    label: string;
  }[] = [
    {
      isVisible: allowAdmin || false,
      value: CollectiviteRole.ADMIN,
      label: getAccessLevelLabel(CollectiviteRole.ADMIN),
    },
    {
      isVisible: true,
      value: CollectiviteRole.EDITION,
      label: getAccessLevelLabel(CollectiviteRole.EDITION),
    },
    {
      isVisible: isAccessEditionFichesIndicateursEnabled || false,
      value: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      label: getAccessLevelLabel(CollectiviteRole.EDITION_FICHES_INDICATEURS),
    },
    {
      isVisible: true,
      value: CollectiviteRole.LECTURE,
      label: getAccessLevelLabel(CollectiviteRole.LECTURE),
    },
  ].filter((level) => level.isVisible);

  return accessLevels;
};
