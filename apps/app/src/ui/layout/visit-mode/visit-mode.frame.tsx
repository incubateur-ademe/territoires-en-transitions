import { appLabels } from '@/app/labels/catalog';
import { Badge, Button, Icon } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import type { ReactNode } from 'react';
import type { VisitMode } from './visit-mode';

/**
 * Encadre l'espace d'une collectivité qu'on visite sans en être membre : une
 * barre collée en haut de l'écran rappelle chez qui l'on est et ramène chez
 * soi, et la navigation de la collectivité passe dans le cadre, avec la page.
 */
export const VisitModeFrame = ({
  visit,
  nav,
  children,
}: {
  visit: VisitMode;
  nav: ReactNode;
  children: ReactNode;
}) => (
  <div className="grow flex flex-col bg-primary-9">
    <div
      role="status"
      data-test={visit.dataTest}
      className="sticky top-0 z-sticky-header bg-primary-9 p-2 md:p-4 flex flex-wrap items-center gap-3 text-sm text-white"
    >
      <Button
        size="sm"
        variant="white"
        icon="arrow-left-line"
        dataTest={visit.backLink.dataTest}
        href={visit.backLink.href}
        onClick={visit.backLink.onClick}
      >
        {visit.backLink.label}
      </Button>
      <Icon icon="arrow-right-s-line" size="sm" className="shrink-0" />
      <Icon icon="eye-line" size="sm" className="shrink-0" />
      <span className="min-w-0">
        {appLabels.visiteEspaceDe}{' '}
        <span className="font-bold">{visit.collectiviteNom}</span>
        {visit.isReadOnly && appLabels.visiteLectureSeule}
        {visit.notice && <> {visit.notice}</>}
      </span>
      <div className="ml-auto flex items-center gap-3">
        {visit.actions}
        <Badge
          title={appLabels.visiteBadge}
          variant="new"
          size="sm"
          uppercase
        />
      </div>
      <InvertedCorners />
    </div>
    <div className="grow flex flex-col mx-2 md:mx-4 mb-2 md:mb-4 rounded-[10px] overflow-clip bg-grey-2 shadow-md">
      <div className="bg-white border-b border-grey-3 max-lg:hidden">{nav}</div>
      {children}
    </div>
  </div>
);

/**
 * Sous la barre, les coins de la carte restent arrondis quand la barre est
 * collée et que la carte défile dessous : chaque coin est le dehors d'un arrondi,
 * peint par l'ombre d'une boîte transparente.
 */
const InvertedCorners = () => (
  <div className="pointer-events-none absolute top-full inset-x-2 md:inset-x-4 h-2.5 flex justify-between">
    <Corner className="rounded-tl-[10px]" />
    <Corner className="rounded-tr-[10px] -translate-x-2.5" />
  </div>
);

const Corner = ({ className }: { className: string }) => (
  <div className="size-2.5 overflow-hidden">
    <div
      className={cn(
        'size-5 shadow-[0_0_0_10px_theme(colors.primary.9)]',
        className
      )}
    />
  </div>
);
