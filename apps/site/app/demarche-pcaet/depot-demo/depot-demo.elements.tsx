import styles from '@/site/components/animated-demo/animated-demo.module.css';
import type { DemarchePcaetVulnerabiliteNiveau } from '@tet/domain/demarches';
import { Badge, BadgeProps, Icon } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import { CompletionStatut, EtapeStatus, UploadPhase } from './depot-demo.state';

/**
 * Éléments partagés par les scènes large et compacte de la démo. Ils imitent
 * l'interface de l'app sans être interactifs : la démo se regarde.
 */

type BadgeSize = 'xs' | 'sm';

const Tick = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3.5}
    className={className}
  >
    <path d="M5 12l5 5 9-10" />
  </svg>
);

/** Pastille verte cochée ; sa taille vient de `className`. */
export const Check = ({ className }: { className?: string }) => (
  <span
    className={classNames(
      'flex flex-none items-center justify-center rounded-full bg-success-1 text-white',
      styles.pop,
      className
    )}
  >
    <Tick className="size-[55%]" />
  </span>
);

export const Checkbox = ({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}) =>
  checked ? (
    <span
      className={classNames(
        'flex flex-none items-center justify-center rounded-[3px] bg-primary-7 text-white',
        styles.pop,
        className
      )}
    >
      <Tick className="size-[65%]" />
    </span>
  ) : (
    <span
      className={classNames(
        'flex-none rounded-[3px] border border-primary-4 bg-white',
        className
      )}
    />
  );

export const PdfIcon = ({ className }: { className?: string }) => (
  <span
    className={classNames(
      'flex flex-none items-end justify-center pb-0.5 rounded-sm bg-error-1 font-bold text-white',
      className
    )}
  >
    PDF
  </span>
);

/**
 * Puce numérotée du stepper de l'app : pleine dès que l'étape est atteinte,
 * blanche tant qu'elle est à venir.
 */
export const EtapeBullet = ({
  status,
  number,
  className,
}: {
  status: EtapeStatus;
  number: number;
  className?: string;
}) => (
  <span
    className={classNames(
      'flex flex-none items-center justify-center rounded-full border-2 font-bold transition-colors duration-300',
      status === 'upcoming'
        ? 'bg-white border-grey-3 text-grey-10'
        : 'bg-primary-7 border-primary-7 text-white',
      className
    )}
  >
    {number}
  </span>
);

/**
 * Complétude d'une étape, comme `DemarcheCompletionBadge` dans l'app : badge
 * plein, coche sur « Complété » sauf là où l'icône du volet est déjà au-dessus.
 */
export const CompletionBadge = ({
  statut,
  size = 'sm',
  withIcon = true,
}: {
  statut: CompletionStatut;
  size?: BadgeSize;
  withIcon?: boolean;
}) => (
  <Badge
    title={statut === 'complete' ? 'Complété' : 'À compléter'}
    variant={statut === 'complete' ? 'success' : 'warning'}
    type="inverted"
    icon={withIcon && statut === 'complete' ? 'check-line' : undefined}
    iconPosition="left"
    size={size}
    trim={false}
    className="flex-none"
  />
);

export const DocumentTypeBadge = ({
  required,
  size = 'sm',
}: {
  required: boolean;
  size?: BadgeSize;
}) => (
  <Badge
    title={required ? 'Obligatoire' : 'Optionnel'}
    variant={required ? 'info' : 'grey'}
    type="solid"
    size={size}
    uppercase={false}
    trim={false}
    className="flex-none"
  />
);

/**
 * Mêmes libellés et couleurs que le tableau de vulnérabilité de l'app
 * (`DEMARCHE_PCAET_VULNERABILITE_NIVEAU_*`, que le site ne peut pas importer).
 */
const NIVEAU_BADGES: Record<
  DemarchePcaetVulnerabiliteNiveau,
  { label: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  non_concerne: { label: 'non concerné', variant: 'grey' },
  faible: { label: 'faible', variant: 'success' },
  moyen: { label: 'moyen', variant: 'warning' },
  fort: { label: 'fort', variant: 'error' },
};

/** Niveau saisi, ou l'invite « + niveau » de l'app tant qu'il ne l'est pas. */
export const NiveauVulnerabilite = ({
  niveau,
  size = 'sm',
}: {
  niveau: DemarchePcaetVulnerabiliteNiveau | null;
  size?: BadgeSize;
}) =>
  niveau ? (
    <span className={styles.pop}>
      <Badge
        title={NIVEAU_BADGES[niveau].label}
        variant={NIVEAU_BADGES[niveau].variant}
        size={size}
        uppercase
        trim={false}
        className="whitespace-nowrap"
      />
    </span>
  ) : (
    <span
      className={classNames(
        'text-grey-8 opacity-60',
        size === 'xs' ? 'text-[11px]' : 'text-[13px]'
      )}
    >
      + niveau
    </span>
  );

/** Bouton de l'app imité ; `pressed` le fonce pendant un clic simulé. */
export const FakeButton = ({
  variant = 'primary',
  enabled = true,
  pressed = false,
  className,
  children,
}: {
  variant?: 'primary' | 'secondary';
  enabled?: boolean;
  pressed?: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <span
    className={classNames(
      'flex items-center justify-center gap-2 rounded-md font-bold transition-colors duration-200',
      variant === 'secondary'
        ? 'border border-primary-9 bg-white text-primary-9'
        : {
            'bg-primary-3 text-primary-6': !enabled,
            'bg-primary-10 text-white': enabled && pressed,
            'bg-primary-9 text-white': enabled && !pressed,
          },
      className
    )}
  >
    {children}
  </span>
);

/**
 * Bouton scindé « Importer un plan » de l'app : l'import est l'action
 * principale, la création manuelle est rangée derrière la flèche.
 */
export const ImportSplitButton = ({
  variant,
  isLoading,
  className,
}: {
  variant: 'primary' | 'secondary';
  isLoading: boolean;
  className?: string;
}) => (
  <FakeButton
    variant={variant}
    className={classNames('px-3.5 py-[9px] text-[13px]', className)}
  >
    {isLoading ? (
      <>
        Import en cours…
        <span
          className={classNames(
            'size-3.5 rounded-full border-2 border-current border-t-transparent opacity-70',
            styles.spin
          )}
        />
      </>
    ) : (
      <>
        <Icon icon="import-line" size="sm" />
        Importer un plan
      </>
    )}
    <span
      className={classNames(
        'pl-2 border-l',
        variant === 'secondary' ? 'border-primary-9/30' : 'border-white/40'
      )}
    >
      ▾
    </span>
  </FakeButton>
);

/** Bouton « Avis » de l'app : chaque avis reçu se télécharge. */
export const AvisDownloadButton = ({ size = 'sm' }: { size?: BadgeSize }) => (
  <FakeButton
    variant="secondary"
    className={classNames(
      'flex-none',
      size === 'xs' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
    )}
  >
    <Icon icon="download-line" size="xs" />
    Avis
  </FakeButton>
);

/**
 * Dépôt d'un fichier dans une ligne de pièce : bouton, vol du fichier, barre
 * d'envoi, puis fichier déposé — comme la colonne « Documents liés » de l'app.
 */
export const DocumentUpload = ({
  phase,
  progress,
  file,
  size = 'sm',
}: {
  phase: UploadPhase;
  progress: number;
  file: string;
  size?: BadgeSize;
}) => {
  const isCompact = size === 'xs';
  switch (phase) {
    case 'empty':
      return (
        <FakeButton
          variant="secondary"
          className={classNames(
            'self-start',
            isCompact ? 'px-2 py-[3px] text-[11px]' : 'px-2.5 py-1 text-xs'
          )}
        >
          Déposer un document
        </FakeButton>
      );
    case 'flying':
      return (
        <span
          className={classNames(
            'self-start flex items-center gap-1.5 bg-white border border-primary-3 rounded-md shadow-[0_8px_18px_rgba(64,64,146,0.2)] font-medium',
            isCompact ? 'px-2 py-[3px] text-[11px]' : 'px-2 py-1 text-xs',
            styles.fly
          )}
        >
          <PdfIcon
            className={
              isCompact ? 'w-3 h-[15px] text-[4px]' : 'w-3.5 h-[18px] text-[5px]'
            }
          />
          {file}
        </span>
      );
    case 'uploading':
      return (
        <span className="flex flex-col flex-1 gap-1">
          {!isCompact && <span className="text-xs text-primary-10">{file}</span>}
          <span className="flex h-1 overflow-hidden rounded-sm bg-primary-2">
            <span
              className="h-full bg-primary-7"
              style={{ width: `${progress * 100}%` }}
            />
          </span>
        </span>
      );
    default:
      return (
        <span
          className={classNames(
            'flex items-center gap-2 text-primary-9',
            isCompact ? 'text-xs' : 'text-[13px]',
            styles.fade
          )}
        >
          <Check className="size-[13px]" />
          <span className="underline">{file}</span>
        </span>
      );
  }
};

/** Enveloppe qui s'ouvre et laisse sortir les avis rendus. */
export const Envelope = ({
  isOpen,
  report,
  compact,
}: {
  isOpen: boolean;
  report?: string;
  compact: boolean;
}) => (
  <div
    className={classNames(
      'absolute',
      compact
        ? 'left-[111px] top-9 w-[110px] h-[72px]'
        : 'left-[70px] top-[170px] w-40 h-[104px]',
      styles.drop
    )}
  >
    <div className="absolute inset-0 z-0 rounded-md bg-primary-4" />
    {report && (
      <span
        key={report}
        className={classNames(
          'absolute z-[1] flex items-center gap-1.5 bg-white border border-primary-3 rounded-md font-bold text-primary-10',
          compact
            ? 'left-2.5 top-2 w-[90px] h-[30px] px-1.5 text-[9px]'
            : 'left-[18px] top-3.5 w-[124px] h-10 px-2 text-[11px]',
          styles.rise
        )}
      >
        <span
          className={classNames(
            'flex-none rounded-sm bg-error-1',
            compact ? 'w-2.5 h-[13px]' : 'w-3.5 h-[18px]'
          )}
        />
        {report}
      </span>
    )}
    <div className="absolute inset-0 z-[2] rounded-md bg-primary-3 [clip-path:polygon(0_0,50%_58%,100%_0,100%_100%,0_100%)]" />
    <div
      className={classNames(
        'absolute inset-x-0 top-0 origin-top bg-primary-7 [clip-path:polygon(0_0,100%_0,50%_100%)] transition-transform duration-[400ms] ease-in-out',
        compact ? 'h-[42px]' : 'h-[60px]',
        isOpen ? '-scale-y-100 z-0' : 'z-[3]'
      )}
    />
  </div>
);

/** Interrupteur de l'app : la pastille glisse quand la ligne est saisie. */
export const Toggle = ({
  isOn,
  className,
}: {
  isOn: boolean;
  className?: string;
}) => (
  <span
    className={classNames(
      'relative flex-none rounded-full transition-colors duration-200',
      isOn ? 'bg-primary-7' : 'bg-primary-4',
      className
    )}
  >
    <span
      className={classNames(
        'absolute top-0.5 aspect-square h-[calc(100%-4px)] rounded-full bg-white transition-[left] duration-200',
        isOn ? 'left-[calc(100%-2px)] -translate-x-full' : 'left-0.5'
      )}
    />
  </span>
);

/** Alerte « Démarche adoptée » de l'app, une fois le dépôt final validé. */
export const AdoptedBanner = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={classNames(
      'flex items-center gap-2.5 bg-success-2 border border-success-1 rounded-lg font-bold text-success-1',
      compact ? 'px-3 py-2.5 text-sm' : 'px-4 py-3.5 text-[15px]',
      styles.pop
    )}
  >
    <Check className={compact ? 'size-5' : 'size-[22px]'} />
    Démarche adoptée
  </div>
);
