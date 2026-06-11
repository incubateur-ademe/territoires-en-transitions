import { referentielToName } from '@/app/app/labels';
import { appLabels } from '@/app/labels/catalog';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useToastContext } from '@/app/utils/toast/toast-context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  Button,
  Checkbox,
  Icon,
  Spacer,
  Tooltip,
  useCopyToClipboard,
} from '@tet/ui';
import { JSX, useId } from 'react';
import { getMailTemplateToCopyPaste } from './get-mail-template-to-copy-paste';

const FeedbackBanner = (): JSX.Element => (
  <aside className="flex items-start gap-2 rounded-md bg-info-2 p-4">
    <Icon
      icon="information-fill"
      aria-hidden="true"
      size="md"
      className="text-info-1 shrink-0"
    />
    <p className="text-sm text-info-1 font-bold mb-0">
      {appLabels.mailClotureAuditRetourTexteAvant}{' '}
      <a
        href={appLabels.mailClotureAuditRetourLien}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-info-1"
      >
        {appLabels.mailClotureAuditRetourTexteLien}
      </a>
    </p>
  </aside>
);

const FieldWithCopy = ({
  label,
  value,
  copyButtonLabel,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  copyButtonLabel: string;
  onCopy: (text: string) => Promise<void>;
  multiline?: boolean;
}): JSX.Element => {
  const id = useId();
  return (
    <div className="flex flex-col items-start gap-2">
      <div>
        <label
          htmlFor={id}
          className="ml-0 block text-sm font-medium text-primary-9"
        >
          {label}
        </label>
      </div>
      <div className="flex w-full gap-2">
        <textarea
          id={id}
          readOnly
          value={value}
          rows={multiline ? 8 : 1}
          className="w-full border border-grey-4 rounded-md p-2 text-sm bg-grey-1 resize-none"
        />
        <div>
          <Tooltip label={copyButtonLabel}>
            <Button
              variant="outlined"
              size="xs"
              onClick={() => onCopy(value)}
              aria-label={copyButtonLabel}
              icon="file-copy-line"
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

const useGetMailTemplateToCopyPaste = (demandeId: number | null) => {
  const collectivite = useCurrentCollectivite();
  const referentielId = useReferentielId();
  const collectiviteNom = collectivite?.nom;
  const referentielNom = referentielId
    ? referentielToName[referentielId]
    : undefined;

  return {
    template: getMailTemplateToCopyPaste({
      demandeId,
      collectiviteNom: collectiviteNom ?? '',
      referentielNom: referentielNom ?? '',
    }),
  };
};

export const MailTemplate = ({
  demandeId,
  engagementChecked,
  onEngagementCheckedChange,
}: {
  demandeId: number | null;
  engagementChecked: boolean;
  onEngagementCheckedChange: (next: boolean) => void;
}): JSX.Element => {
  const { template } = useGetMailTemplateToCopyPaste(demandeId);
  const { copy } = useCopyToClipboard();
  const { setToast } = useToastContext();

  const handleCopy = async (text: string): Promise<void> => {
    const ok = await copy(text);
    setToast(
      ok ? 'success' : 'error',
      ok ? appLabels.copie : appLabels.copieErreur
    );
  };

  return (
    <div className="flex flex-col">
      <p className="whitespace-pre-line mb-0 text-sm">
        {appLabels.mailClotureAuditIntro}
      </p>
      <Spacer height={1} />
      <FeedbackBanner />
      <Spacer height={2} />

      <FieldWithCopy
        label={appLabels.mailClotureAuditObjetLabel}
        value={template.subject}
        copyButtonLabel={appLabels.copierObjet}
        onCopy={handleCopy}
      />
      <Spacer height={1} />
      <FieldWithCopy
        label={appLabels.mailClotureAuditContenuLabel}
        value={template.body}
        copyButtonLabel={appLabels.copierContenu}
        onCopy={handleCopy}
        multiline
      />
      <Spacer height={2} />
      <Checkbox
        size="sm"
        checked={engagementChecked}
        onChange={(e) => onEngagementCheckedChange(e.target.checked)}
        label={appLabels.mailClotureAuditEngagementCheckbox}
      />
    </div>
  );
};
