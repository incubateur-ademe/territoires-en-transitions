import { ServicesWidget } from '@betagouv/les-communs-widget';

import { ENV } from '@tet/api/environmentVariables';
import { AppEnvironment } from '@tet/domain/utils';
import { useFicheContext } from '../../context/fiche-context';

export const ServicesWidgetTab = () => {
  const { fiche } = useFicheContext();
  return (
    <ServicesWidget
      projectId={fiche.id.toString()}
      isStagingEnv={ENV.application_env === AppEnvironment.STAGING}
      idType="tetId"
    />
  );
};
