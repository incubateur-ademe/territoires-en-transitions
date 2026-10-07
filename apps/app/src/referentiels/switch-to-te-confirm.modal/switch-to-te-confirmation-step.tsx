import { appLabels } from '@/app/labels/catalog';
import { Alert, Button, Checkbox, Field, Input } from '@tet/ui';
import { BulletList } from './bullet-list';
import { SwitchToTeConfirmState } from './use-switch-to-te-confirm-state';

const EXPORT_HELP_LINK =
  'https://aide.territoiresentransitions.fr/fr/article/figer-consulter-et-exporter-un-etat-des-lieux-yatjta/#3-exporter-une-sauvegarde-complete-dun-etat-des-lieux';

export const SwitchToTeConfirmationStep = ({
  state,
}: {
  state: SwitchToTeConfirmState;
}) => {
  const {
    hasExported,
    setHasExported,
    confirmText,
    textConfirmed,
    setConfirmText,
  } = state;

  return (
    <div className="flex flex-col gap-4">
      <Alert
        state="error"
        title={appLabels.switchToTeConfirmIrreversibleTitre}
        description={
          <>
            <BulletList
              content={appLabels.switchToTeConfirmIrreversibleItems}
            />
            <p className="m-0">
              {appLabels.switchToTeConfirmIrreversibleNote}
            </p>
          </>
        }
      />
      <Alert
        state="info"
        description={
          <>
            {appLabels.switchToTeConfirmExportInfo}{' '}
            <Button external variant="underlined" href={EXPORT_HELP_LINK}>
              {appLabels.switchToTeConfirmExportLinkLabel}
            </Button>
          </>
        }
      />
      <Checkbox
        label={appLabels.switchToTeConfirmCheckboxLabel}
        checked={hasExported}
        onChange={(e) => setHasExported(e.target.checked)}
      />
      <Field
        title={appLabels.switchToTeConfirmInputTitle}
        hint={appLabels.switchToTeConfirmInputHint({
          keyword: appLabels.switchToTeConfirmKeyword,
        })}
        state={confirmText && !textConfirmed ? 'error' : 'default'}
        message={
          confirmText && !textConfirmed
            ? appLabels.switchToTeConfirmInputErrorMessage({
                keyword: appLabels.switchToTeConfirmKeyword,
              })
            : undefined
        }
      >
        <Input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
        />
      </Field>
    </div>
  );
};
