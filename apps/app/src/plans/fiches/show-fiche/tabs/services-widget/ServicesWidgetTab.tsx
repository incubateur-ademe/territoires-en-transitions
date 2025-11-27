import { ServicesWidget } from '@betagouv/les-communs-widget';

import { ENV } from '@/api/environmentVariables';
import { AppEnvironment } from '@/domain/utils';

type ServicesWidgetTabProps = {
  ficheId: number;
};

export const ServicesWidgetTab = ({ ficheId }: ServicesWidgetTabProps) => {
  return (
    <ServicesWidget
      projectId={ficheId.toString()}
      isStagingEnv={ENV.application_env === AppEnvironment.STAGING}
      idType="tetId"
    />
  );
};

