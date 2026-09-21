import { Icon } from '../Icon';
import { cn } from '../../utils/cn';

/**
 * Retrait à appliquer au contenu d'une cellule enfant, pour qu'il commence
 * après le coude de `TableTreeBranch`.
 */
export const tableTreeChildIndentClassName = 'pl-7';

export type TableTreeBranchProps = {
  /**
   * Dernier enfant de sa fratrie : le trait vertical s'arrête à son coude au
   * lieu de filer jusqu'à la ligne racine suivante.
   */
  isLast?: boolean;
};

/**
 * Traits d'arborescence d'une ligne enfant : un trait vertical qui relie la
 * fratrie et un coude horizontal vers le libellé.
 *
 * À poser comme premier enfant d'une `TableCell`, dont il se sert comme bloc
 * de positionnement — d'où le `pinnedLeft` requis, qui rend la cellule
 * `sticky`, donc positionnée. Le trait déborde d'un pixel sous la cellule pour
 * enjamber le liseré de la ligne : arrêté à ras, il se lit comme rompu à
 * chaque rang.
 *
 * Purement décoratif, et donc masqué au lecteur d'écran : la hiérarchie doit
 * lui être portée autrement, par exemple en nommant la parente dans le nom
 * accessible de la ligne.
 */
export const TableTreeBranch = ({ isLast = false }: TableTreeBranchProps) => (
  <span aria-hidden className="pointer-events-none">
    <span
      className={cn('absolute left-6 top-0 w-px bg-grey-5', {
        'h-1/2': isLast,
        '-bottom-px': !isLast,
      })}
    />
    <span className="absolute left-6 top-1/2 h-px w-3.5 bg-grey-5" />
  </span>
);

/**
 * Place du chevron, à réserver sur les lignes racines qui n'en portent pas :
 * sans elle, un libellé sans grappe s'aligne 20 px à gauche des autres.
 */
export const TableTreeTogglePlaceholder = () => (
  <span aria-hidden className="-ml-1 size-5 shrink-0" />
);

export type TableTreeToggleProps = {
  /** La grappe est dépliée. */
  isExpanded: boolean;
  onToggle: () => void;
  /** Nom accessible du bouton, qui doit nommer la grappe visée. */
  label: string;
  dataTest?: string;
};

/**
 * Chevron de repli d'une grappe, à poser sur la ligne parente. Reprend la
 * flèche de l'`Accordion` : même icône, même rotation, pour que déplier se
 * reconnaisse d'un écran à l'autre.
 */
export const TableTreeToggle = ({
  isExpanded,
  onToggle,
  label,
  dataTest,
}: TableTreeToggleProps) => (
  <button
    type="button"
    aria-expanded={isExpanded}
    aria-label={label}
    title={label}
    data-test={dataTest}
    // Le clic est arrêté avant la cellule : celle-ci peut ouvrir une édition
    // en ligne, et déplier ne doit pas la déclencher.
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    onKeyDown={(e) => e.stopPropagation()}
    className="-ml-1 flex size-5 shrink-0 items-center justify-center rounded hover:bg-grey-3"
  >
    <Icon
      icon="arrow-right-s-line"
      size="sm"
      className={cn('text-primary transition-transform', {
        'rotate-90': isExpanded,
      })}
    />
  </button>
);
