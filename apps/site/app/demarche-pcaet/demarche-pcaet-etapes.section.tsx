'use client';

import Section from '@/site/components/sections/Section';
import { Badge, Button, Icon } from '@tet/ui';
import classNames from 'classnames';
import { RefObject, useEffect, useRef, useState } from 'react';
import { useIntersection, useMedia } from 'react-use';
import type { DepotEtape } from './demarche-pcaet.data';
import styles from './demarche-pcaet.module.css';

const STEP_DURATION_MS = 5000;
const DETAIL_ID = 'demarche-pcaet-etape-detail';
const ACTIVE_RING = 'shadow-[0_0_0_6px_theme(colors.primary.3)]';

type EtapeStatus = 'done' | 'active' | 'upcoming';

const getStatus = (index: number, active: number): EtapeStatus =>
  index < active ? 'done' : index === active ? 'active' : 'upcoming';

/**
 * Défile seul sur grand écran, tant que la section est visible et que
 * l'utilisateur ne réduit pas les animations. Le focus ou le clic sur une étape
 * met en pause, jusqu'à ce qu'il demande la reprise.
 */
const useEtapesAutoplay = (count: number) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const canAutoplay = useMedia(
    '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    false
  );
  const intersection = useIntersection(sectionRef as RefObject<HTMLElement>, {
    threshold: 0.4,
  });

  const isAutoplaying =
    canAutoplay && !isPaused && (intersection?.isIntersecting ?? false);

  useEffect(() => {
    if (!isAutoplaying) return;
    const interval = setInterval(
      () => setActive((current) => (current + 1) % count),
      STEP_DURATION_MS
    );
    return () => clearInterval(interval);
  }, [isAutoplaying, count]);

  return {
    sectionRef,
    active,
    isAutoplaying,
    canResume: canAutoplay && isPaused,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
    select: (index: number) => {
      setIsPaused(true);
      setActive(index);
    },
  };
};

const Stakeholders = ({ etape }: { etape: DepotEtape }) => (
  <div className="flex flex-wrap gap-1.5">
    {etape.stakeholders.map((stakeholder) => (
      <Badge
        key={stakeholder}
        title={stakeholder}
        variant="high"
        size="sm"
        uppercase={false}
      />
    ))}
  </div>
);

const Actions = ({
  etape,
  className,
}: {
  etape: DepotEtape;
  className?: string;
}) => (
  <ul
    className={classNames('flex flex-col gap-2 p-0 m-0 list-none', className)}
  >
    {etape.actions.map((action) => (
      <li key={action} className="flex items-start gap-2.5 p-0 text-primary-10">
        <Icon
          icon="check-line"
          size="sm"
          className="flex-none mt-0.5 text-success-1"
        />
        {action}
      </li>
    ))}
  </ul>
);

/** Le survol du bouton parent (`group`) donne à la pastille l'aspect actif. */
const EtapeBullet = ({
  number,
  status,
  className,
}: {
  number: number;
  status: EtapeStatus;
  className?: string;
}) => (
  <span
    className={classNames(
      'relative z-[1] flex items-center justify-center rounded-full border-2 border-primary-9 font-bold transition-[background,color,box-shadow] duration-300',
      'group-hover:bg-primary-9 group-hover:text-white group-hover:shadow-[0_0_0_6px_theme(colors.primary.3)]',
      {
        'bg-primary-9 text-white': status !== 'upcoming',
        'bg-white text-primary-9': status === 'upcoming',
        [ACTIVE_RING]: status === 'active',
      },
      className
    )}
  >
    <span className="sr-only">Étape </span>
    {number}
  </span>
);

/** Frise horizontale et panneau de détail, à partir de `lg`. */
const DesktopEtapes = ({
  etapes,
  active,
  isAutoplaying,
  select,
  pause,
}: {
  etapes: DepotEtape[];
  active: number;
  isAutoplaying: boolean;
  select: (index: number) => void;
  pause: () => void;
}) => {
  const etape = etapes[active];
  const last = etapes.length - 1;

  return (
    <div className="max-lg:hidden flex flex-col gap-7 w-full">
      <ol
        className="grid gap-6 p-0 m-0 list-none"
        style={{
          gridTemplateColumns: `repeat(${etapes.length}, minmax(0, 1fr))`,
        }}
      >
        {etapes.map((item, index) => (
          <li key={item.title} className="relative flex p-0">
            {/* Segment vers l'étape suivante : plein une fois l'étape passée,
                rempli par le minuteur pendant le défilement. Le segment plein
                prend le relais du minuteur sans repartir de zéro. */}
            {index < last && (
              <span
                aria-hidden
                className="absolute left-1/2 top-[23px] flex h-0.5 w-[calc(100%+24px)] bg-primary-3"
              >
                {index < active && (
                  <span className="w-full h-full bg-primary-9" />
                )}
                {isAutoplaying && index === active && (
                  <span
                    className={classNames('h-full bg-primary-9', styles.timer)}
                    style={{ animationDuration: `${STEP_DURATION_MS}ms` }}
                  />
                )}
              </span>
            )}
            <button
              type="button"
              aria-current={index === active ? 'step' : undefined}
              aria-controls={DETAIL_ID}
              onClick={() => select(index)}
              onFocus={pause}
              className="group flex flex-1 flex-col items-center gap-3 px-1 pb-2 text-center !bg-transparent"
            >
              <EtapeBullet
                number={index + 1}
                status={getStatus(index, active)}
                className="size-12 text-lg"
              />
              <span
                className={classNames(
                  'text-[17px] leading-snug text-primary-9',
                  index === active ? 'font-bold' : 'font-medium'
                )}
              >
                {item.title}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {/* Muet pendant le défilement automatique : seule une étape choisie
          par l'utilisateur est annoncée. */}
      <div id={DETAIL_ID} aria-live={isAutoplaying ? 'off' : 'polite'}>
        <div
          key={active}
          className={classNames(
            'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 px-9 py-8 bg-primary-0 border border-primary-3 rounded-[10px]',
            styles.detail
          )}
        >
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-wider text-primary-7 uppercase">
              Étape {active + 1} sur {etapes.length}
            </span>
            <h3 className="mb-0 text-2xl text-primary-9">{etape.title}</h3>
            <p className="mb-0 leading-relaxed text-primary-10">
              {etape.detail}
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-primary-10">
                Qui intervient :
              </span>
              <Stakeholders etape={etape} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold text-primary-10">
              Ce que vous faites :
            </span>
            <Actions etape={etape} className="text-[15px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Frise verticale dépliable, sous `lg`. */
const MobileEtapes = ({ etapes }: { etapes: DepotEtape[] }) => {
  const [open, setOpen] = useState<number | null>(0);
  const last = etapes.length - 1;

  return (
    <ol className="lg:hidden flex flex-col p-0 m-0 list-none">
      {etapes.map((etape, index) => {
        const isOpen = index === open;
        const panelId = `demarche-pcaet-etape-${index}`;
        return (
          <li
            key={etape.title}
            className="grid grid-cols-[40px_minmax(0,1fr)] gap-3.5 p-0"
          >
            <div className="flex flex-col items-center">
              <EtapeBullet
                number={index + 1}
                status={open === null ? 'upcoming' : getStatus(index, open)}
                className="flex-none size-10"
              />
              {index < last && (
                <span
                  aria-hidden
                  className={classNames(
                    'flex-1 w-0.5 min-h-4 transition-colors duration-300',
                    open !== null && index < open
                      ? 'bg-primary-9'
                      : 'bg-primary-3'
                  )}
                />
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-0 pb-4">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : index)}
                className={classNames(
                  'min-h-10 text-left text-[17px] leading-snug text-primary-9 !bg-transparent',
                  isOpen ? 'font-bold' : 'font-medium'
                )}
              >
                {etape.title}
              </button>
              {isOpen && (
                <div
                  id={panelId}
                  className={classNames(
                    'flex flex-col gap-3 p-3.5 bg-primary-0 border border-primary-3 rounded-lg text-sm',
                    styles.detail
                  )}
                >
                  <p className="mb-0 text-sm leading-relaxed text-primary-10">
                    {etape.detail}
                  </p>
                  <Stakeholders etape={etape} />
                  <Actions etape={etape} className="text-[13px]" />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export const DemarchePcaetEtapesSection = ({
  etapes,
}: {
  etapes: DepotEtape[];
}) => {
  const {
    sectionRef,
    active,
    isAutoplaying,
    canResume,
    pause,
    resume,
    select,
  } = useEtapesAutoplay(etapes.length);

  return (
    <Section containerClassName="pt-0">
      <div
        ref={sectionRef}
        className="flex flex-col items-center gap-8 lg:gap-16"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="mb-0 text-center">Les étapes de votre dépôt</h2>
          <p className="mb-0 text-primary-10 lg:text-[17px]">
            Vous retrouverez ces étapes dans le panneau « Avancement » de votre
            espace de dépôt.
          </p>
          {/* Toujours rendu (invisible hors pause) pour ne pas décaler la
              frise quand il apparaît. */}
          <Button
            variant="underlined"
            size="xs"
            icon="play-line"
            onClick={resume}
            className={classNames('max-lg:hidden', { invisible: !canResume })}
          >
            Reprendre le défilement des étapes
          </Button>
        </div>
        <DesktopEtapes
          etapes={etapes}
          active={active}
          isAutoplaying={isAutoplaying}
          select={select}
          pause={pause}
        />
        <MobileEtapes etapes={etapes} />
      </div>
    </Section>
  );
};
