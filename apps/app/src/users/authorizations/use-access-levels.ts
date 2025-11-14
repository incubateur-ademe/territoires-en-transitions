import { useIsAccessEditionFichesIndicateursEnabled } from './use-is-access-edition-fiches-indicateurs-enabled';
import {
  CollectiviteAccessLevelEnum,
  CollectiviteAccessLevel,
} from '@/domain/users';
import { getAccessLevelLabel } from './permission-access-level.utils';

type UseAccessLevelsProps = {
  allowAdmin?: boolean;
};

export const useAccessLevels = (props: UseAccessLevelsProps) => {
  const { allowAdmin } = props;

  const isAccessEditionFichesIndicateursEnabled =
    useIsAccessEditionFichesIndicateursEnabled();

  const accessLevels: {
    isVisible: boolean;
    value: CollectiviteAccessLevel;
    label: string;
  }[] = [
    {
      isVisible: allowAdmin || false,
      value: CollectiviteAccessLevelEnum.ADMIN,
      label: getAccessLevelLabel(CollectiviteAccessLevelEnum.ADMIN),
    },
    {
      isVisible: true,
      value: CollectiviteAccessLevelEnum.EDITION,
      label: getAccessLevelLabel(CollectiviteAccessLevelEnum.EDITION),
    },
    {
      isVisible: isAccessEditionFichesIndicateursEnabled || false,
      value: CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS,
      label: getAccessLevelLabel(
        CollectiviteAccessLevelEnum.EDITION_FICHES_INDICATEURS
      ),
    },
    {
      isVisible: true,
      value: CollectiviteAccessLevelEnum.LECTURE,
      label: getAccessLevelLabel(CollectiviteAccessLevelEnum.LECTURE),
    },
  ].filter((level) => level.isVisible);

  return accessLevels;
};
