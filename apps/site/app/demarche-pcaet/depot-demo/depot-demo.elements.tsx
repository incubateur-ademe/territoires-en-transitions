import styles from '@/site/components/demo-animee/demo-animee.module.css';
import type { DemarchePcaetVulnerabiliteNiveau } from '@tet/domain/demarches';
import { Badge, BadgeProps, Icon } from '@tet/ui';
import classNames from 'classnames';
import { ReactNode } from 'react';
import { EtatEtape, PhaseImport, StatutVolet } from './demo-depot.etat';
import { IMPORT_PROGRAMME } from './demo-depot.scenario';

/**
 * Éléments partagés par les scènes large et compacte de la démo. Ils imitent
 * l'interface de l'app sans être interactifs : la démo se regarde.
 */

const Trait = ({ className }: { className?: string }) => (
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
export const Coche = ({ className }: { className?: string }) => (
  <span
    className={classNames(
      'flex flex-none items-center justify-center rounded-full bg-success-1 text-white',
      styles.pop,
      className
    )}
  >
    <Trait className="size-[55%]" />
  </span>
);

export const CaseACocher = ({
  cochee,
  className,
}: {
  cochee: boolean;
  className?: string;
}) =>
  cochee ? (
    <span
      className={classNames(
        'flex flex-none items-center justify-center rounded-[3px] bg-primary-7 text-white',
        styles.pop,
        className
      )}
    >
      <Trait className="size-[65%]" />
    </span>
  ) : (
    <span
      className={classNames(
        'flex-none rounded-[3px] border border-primary-4 bg-white',
        className
      )}
    />
  );

export const IconePdf = ({ className }: { className?: string }) => (
  <span
    className={classNames(
      'flex flex-none items-end justify-center pb-0.5 rounded-sm bg-error-1 font-bold text-white',
      className
    )}
  >
    PDF
  </span>
);

export const PastilleEtape = ({
  etat,
  numero,
  className,
}: {
  etat: EtatEtape;
  numero: number;
  className?: string;
}) =>
  etat === 'faite' ? (
    <Coche className={className} />
  ) : (
    <span
      className={classNames(
        'flex flex-none items-center justify-center rounded-full font-bold',
        etat === 'active'
          ? 'bg-primary-7 text-white shadow-[0_0_0_4px_theme(colors.primary.3)]'
          : 'bg-white border border-primary-4 text-primary-9',
        className
      )}
    >
      {numero}
    </span>
  );

const BADGE_VOLET = {
  complete: { titre: 'Complété', variant: 'success' },
  'a-completer': { titre: 'À compléter', variant: 'warning' },
  optionnel: { titre: 'Optionnel', variant: 'grey' },
} as const;

type TailleBadge = 'xs' | 'sm';

export const BadgeStatutVolet = ({
  statut,
  taille = 'sm',
}: {
  statut: StatutVolet;
  taille?: TailleBadge;
}) => (
  <Badge
    title={BADGE_VOLET[statut].titre}
    variant={BADGE_VOLET[statut].variant}
    size={taille}
    trim={false}
    className="flex-none"
  />
);

export const BadgeTypeDocument = ({
  obligatoire,
  taille = 'sm',
}: {
  obligatoire: boolean;
  taille?: TailleBadge;
}) => (
  <Badge
    title={obligatoire ? 'Obligatoire' : 'Optionnel'}
    variant={obligatoire ? 'standard' : 'grey'}
    size={taille}
    uppercase={false}
    trim={false}
    className="flex-none"
  />
);

export const BadgeRecu = ({ taille = 'sm' }: { taille?: TailleBadge }) => (
  <Badge title="Reçu" variant="success" size={taille} className="flex-none" />
);

/**
 * Mêmes libellés et couleurs que le tableau de vulnérabilité de l'app
 * (`DEMARCHE_PCAET_VULNERABILITE_NIVEAU_*`, que le site ne peut pas importer).
 */
const NIVEAU_VULNERABILITE: Record<
  DemarchePcaetVulnerabiliteNiveau,
  { libelle: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  non_concerne: { libelle: 'non concerné', variant: 'grey' },
  faible: { libelle: 'faible', variant: 'success' },
  moyen: { libelle: 'moyen', variant: 'warning' },
  fort: { libelle: 'fort', variant: 'error' },
};

/** Niveau saisi, ou l'invite « + niveau » de l'app tant qu'il ne l'est pas. */
export const NiveauVulnerabilite = ({
  niveau,
  taille = 'sm',
}: {
  niveau: DemarchePcaetVulnerabiliteNiveau | null;
  taille?: TailleBadge;
}) =>
  niveau ? (
    <span className={styles.pop}>
      <Badge
        title={NIVEAU_VULNERABILITE[niveau].libelle}
        variant={NIVEAU_VULNERABILITE[niveau].variant}
        size={taille}
        trim={false}
        className="whitespace-nowrap"
      />
    </span>
  ) : (
    <span
      className={classNames(
        'text-grey-8 opacity-60',
        taille === 'xs' ? 'text-[11px]' : 'text-[13px]'
      )}
    >
      + niveau
    </span>
  );

/** Bouton de l'app imité ; `appuye` le fonce pendant un clic simulé. */
export const BoutonFactice = ({
  variante = 'primaire',
  actif = true,
  appuye = false,
  className,
  children,
}: {
  variante?: 'primaire' | 'secondaire';
  actif?: boolean;
  appuye?: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <span
    className={classNames(
      'flex items-center justify-center gap-2 rounded-md font-bold transition-colors duration-200',
      variante === 'secondaire'
        ? 'border border-primary-9 text-primary-9'
        : {
            'bg-primary-3 text-primary-6': !actif,
            'bg-primary-10 text-white': actif && appuye,
            'bg-primary-9 text-white': actif && !appuye,
          },
      className
    )}
  >
    {children}
  </span>
);

/** Zone de dépôt du programme d'actions, au fil de l'import. */
export const ZoneImport = ({
  phase,
  compact,
}: {
  phase: PhaseImport;
  compact: boolean;
}) => (
  <div
    className={classNames(
      'relative flex flex-none items-center justify-center px-3 text-center border-2 border-dashed rounded-[10px] transition-colors duration-200',
      compact ? 'h-[104px]' : 'h-[118px]',
      {
        'border-primary-4 bg-primary-0': phase === 'attente',
        'border-primary-7 bg-primary-2':
          phase === 'vol' || phase === 'chargement',
        'border-success-1 bg-success-2': phase === 'termine',
      }
    )}
  >
    {phase === 'attente' && (
      <div className="flex flex-col items-center gap-1 text-primary-9">
        <Icon icon="upload-2-line" size={compact ? 'md' : 'lg'} />
        <span
          className={classNames(
            'font-bold',
            compact ? 'text-[13px]' : 'text-sm'
          )}
        >
          {compact
            ? 'Importer un programme existant'
            : "Importer un programme d'actions existant"}
        </span>
        <span className="text-xs text-grey-8">PDF, Word ou Excel</span>
      </div>
    )}
    {phase === 'vol' && (
      <span
        className={classNames(
          'flex items-center gap-2 px-3 py-2 bg-white border border-primary-3 rounded-lg shadow-[0_10px_24px_rgba(64,64,146,0.22)] text-[13px] font-medium',
          styles.vol
        )}
      >
        <IconePdf className="w-[18px] h-[22px] text-[6px]" />
        {IMPORT_PROGRAMME.fichier}
      </span>
    )}
    {phase === 'chargement' && (
      <div className="flex items-center gap-3 text-primary-9">
        <span
          className={classNames(
            'size-5 rounded-full border-[3px] border-primary-3 border-t-primary-7',
            styles.rotation
          )}
        />
        <span className="flex flex-col text-left">
          <span className="text-sm font-bold">Import en cours…</span>
          {!compact && (
            <span className="text-xs text-grey-8">
              Extraction des actions de « {IMPORT_PROGRAMME.fichier} »
            </span>
          )}
        </span>
      </div>
    )}
    {phase === 'termine' && (
      <div
        className={classNames(
          'flex items-center gap-2.5 text-sm font-bold text-success-1',
          styles.pop
        )}
      >
        <Coche className="size-5" />
        {compact
          ? 'Programme importé'
          : `Programme importé depuis « ${IMPORT_PROGRAMME.fichier} »`}
      </div>
    )}
  </div>
);

/** Enveloppe qui s'ouvre et laisse sortir les rapports d'avis. */
export const Enveloppe = ({
  ouverte,
  rapport,
  compact,
}: {
  ouverte: boolean;
  rapport?: string;
  compact: boolean;
}) => (
  <div
    className={classNames(
      'absolute',
      compact
        ? 'left-[111px] top-11 w-[110px] h-[72px]'
        : 'left-[100px] top-[170px] w-40 h-[104px]',
      styles.chute
    )}
  >
    <div className="absolute inset-0 z-0 rounded-md bg-primary-4" />
    {rapport && (
      <span
        key={rapport}
        className={classNames(
          'absolute z-[1] flex items-center gap-1.5 bg-white border border-primary-3 rounded-md font-bold text-primary-10',
          compact
            ? 'left-2.5 top-2 w-[90px] h-[30px] px-1.5 text-[9px]'
            : 'left-[18px] top-3.5 w-[124px] h-10 px-2 text-[11px]',
          styles.montee
        )}
      >
        <span
          className={classNames(
            'flex-none rounded-sm bg-error-1',
            compact ? 'w-2.5 h-[13px]' : 'w-3.5 h-[18px]'
          )}
        />
        {rapport}
      </span>
    )}
    <div className="absolute inset-0 z-[2] rounded-md bg-primary-3 [clip-path:polygon(0_0,50%_58%,100%_0,100%_100%,0_100%)]" />
    <div
      className={classNames(
        'absolute inset-x-0 top-0 origin-top bg-primary-7 [clip-path:polygon(0_0,100%_0,50%_100%)] transition-transform duration-[400ms] ease-in-out',
        compact ? 'h-[42px]' : 'h-[60px]',
        ouverte ? '-scale-y-100 z-0' : 'z-[3]'
      )}
    />
  </div>
);

/** Interrupteur de l'app : la pastille glisse quand la ligne est saisie. */
export const Interrupteur = ({
  actif,
  className,
}: {
  actif: boolean;
  className?: string;
}) => (
  <span
    className={classNames(
      'relative flex-none rounded-full transition-colors duration-200',
      actif ? 'bg-primary-7' : 'bg-primary-4',
      className
    )}
  >
    <span
      className={classNames(
        'absolute top-0.5 aspect-square h-[calc(100%-4px)] rounded-full bg-white transition-[left] duration-200',
        actif ? 'left-[calc(100%-2px)] -translate-x-full' : 'left-0.5'
      )}
    />
  </span>
);

export const VerificationPlan = ({ verifie }: { verifie: boolean }) =>
  verifie ? (
    <span
      className={classNames(
        'flex items-center justify-center size-4 rounded-[3px] bg-success-1 text-white',
        styles.pop
      )}
    >
      <Icon icon="check-line" size="2xs" />
    </span>
  ) : (
    <span className="size-4 rounded-[3px] border border-primary-4 bg-white" />
  );

export const BandeauAdopte = ({ compact = false }: { compact?: boolean }) => (
  <div
    className={classNames(
      'flex items-center gap-2.5 bg-success-2 border border-success-1 rounded-lg font-bold text-success-1',
      compact ? 'px-3 py-2.5 text-sm' : 'mt-2 px-4 py-3.5 text-[15px]',
      styles.pop
    )}
  >
    <Coche className={compact ? 'size-5' : 'size-[22px]'} />
    PCAET adopté et publié
  </div>
);
