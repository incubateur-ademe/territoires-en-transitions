import { Icon } from '@tet/ui';
import { alertClassnames } from '@tet/ui/design-system/Alert/utils';
import { cn } from '@tet/ui/utils/cn';
import { appLabels } from '@/app/labels/catalog';

export const WarningStep2Message = () => {
  const styles = alertClassnames['warning'];
  return (
    <div className={cn('rounded-lg p-4', styles.background)}>
      <div className={cn('flex gap-4 rounded-lg mb-2', styles.background)}>
        <Icon icon="information-fill" className={cn('mt-0.5', styles.text)} />
        <div className={cn('text-base font-bold flex flex-col', styles.text)}>
          {appLabels.authPasRecuCodeEmail}
        </div>
      </div>
      <div className="text-sm [&_*]:text-sm font-medium text-grey-9 [&_*]:text-grey-9 [&>*]:last:mb-0 flex flex-col gap-3 pl-10">
        <ul className="list-disc list-outside">
          <li>{appLabels.authVerifierCourrierIndesirable}</li>
          <li>{appLabels.authAntiSpamPeutBloquer}</li>
          <li>{appLabels.authRapprochezDSI}</li>
          <li>
            {appLabels.authSiAucuneSolutionContacterSupport}{' '}
            <a href="mailto:contact@territoiresentransitions.fr">
              {appLabels.authEmailSupport}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
