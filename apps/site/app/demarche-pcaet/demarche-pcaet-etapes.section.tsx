'use client';

import Section from '@/site/components/sections/Section';
import { Badge, Button, Icon } from '@tet/ui';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { ETAPES_DEPOT, EtapeDepot } from './demarche-pcaet.data';
import styles from './demarche-pcaet.module.css';

const DUREE_ETAPE_MS = 5000;
const DERNIERE = ETAPES_DEPOT.length - 1;
const DETAIL_ID = 'demarche-pcaet-etape-detail';

/**
 * Défile seul sur grand écran, tant que la section est visible, que
 * l'utilisateur ne réduit pas les animations et qu'il n'a pas choisi une étape.
 */
const useDefilementEtapes = () => {
  const section = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [enPause, setEnPause] = useState(false);
  const [peutDefiler, setPeutDefiler] = useState(false);

  useEffect(() => {
    const requete = window.matchMedia(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'
    );
    const synchroniser = () => setPeutDefiler(requete.matches);
    synchroniser();
    requete.addEventListener('change', synchroniser);
    return () => requete.removeEventListener('change', synchroniser);
  }, []);

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const observateur = new IntersectionObserver(
      ([entree]) => setVisible(entree.isIntersecting),
      { threshold: 0.4 }
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  const defile = visible && !enPause && peutDefiler;

  useEffect(() => {
    if (!defile) return;
    const intervalle = setInterval(
      () => setActive((courante) => (courante + 1) % ETAPES_DEPOT.length),
      DUREE_ETAPE_MS
    );
    return () => clearInterval(intervalle);
  }, [defile]);

  const choisir = (index: number) => {
    setEnPause(true);
    setActive(index);
  };

  return {
    section,
    active,
    defile,
    peutDefiler,
    enPause,
    basculerPause: () => setEnPause((pause) => !pause),
    choisir,
  };
};

const Intervenants = ({ etape }: { etape: EtapeDepot }) => (
  <div className="flex flex-wrap gap-1.5">
    {etape.intervenants.map((intervenant) => (
      <Badge
        key={intervenant}
        title={intervenant}
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
  etape: EtapeDepot;
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

const Pastille = ({
  numero,
  etat,
  className,
}: {
  numero: number;
  etat: 'faite' | 'active' | 'a-venir';
  className?: string;
}) => (
  <span
    className={classNames(
      'relative z-[1] flex items-center justify-center rounded-full border-2 border-primary-9 font-bold transition-[background,color,box-shadow] duration-300',
      {
        'bg-primary-9 text-white': etat !== 'a-venir',
        'bg-white text-primary-9': etat === 'a-venir',
        'shadow-[0_0_0_6px_theme(colors.primary.3)]': etat === 'active',
      },
      className
    )}
  >
    <span className="sr-only">Étape </span>
    {numero}
  </span>
);

const etatDe = (index: number, active: number) =>
  index < active ? 'faite' : index === active ? 'active' : 'a-venir';

/** Frise horizontale et panneau de détail, à partir de `lg`. */
const EtapesDesktop = ({
  active,
  defile,
  choisir,
}: {
  active: number;
  defile: boolean;
  choisir: (index: number) => void;
}) => {
  const etape = ETAPES_DEPOT[active];

  return (
    <div className="max-lg:hidden flex flex-col gap-7 w-full">
      <ol className="relative grid grid-cols-5 gap-6 p-0 m-0 list-none">
        <li
          aria-hidden
          className="absolute left-[10%] right-[10%] top-[23px] h-0.5 p-0 bg-primary-3"
        />
        <li
          aria-hidden
          className="absolute left-[10%] top-[23px] h-0.5 p-0 bg-primary-9 transition-[width] duration-500"
          style={{ width: `${(active / DERNIERE) * 80}%` }}
        />
        {ETAPES_DEPOT.map((item, index) => (
          <li key={item.titre} className="relative flex p-0">
            {defile && index === active && index < DERNIERE && (
              <span
                aria-hidden
                className="absolute left-1/2 top-[23px] flex h-0.5 w-[calc(100%+24px)]"
              >
                <span
                  key={active}
                  className={classNames('h-full bg-primary-9', styles.minuteur)}
                />
              </span>
            )}
            <button
              type="button"
              aria-current={index === active ? 'step' : undefined}
              aria-controls={DETAIL_ID}
              onClick={() => choisir(index)}
              className="flex flex-1 flex-col items-center gap-3 px-1 pb-2 text-center rounded-lg"
            >
              <Pastille
                numero={index + 1}
                etat={etatDe(index, active)}
                className="size-12 text-lg"
              />
              <span
                className={classNames(
                  'text-[17px] leading-snug text-primary-9',
                  {
                    'font-bold': index === active,
                    'font-medium': index !== active,
                  }
                )}
              >
                {item.titre}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div id={DETAIL_ID} aria-live="polite">
        <div
          key={active}
          className={classNames(
            'grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 px-9 py-8 bg-primary-0 border border-primary-3 rounded-[10px]',
            styles.detail
          )}
        >
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-wider text-primary-7 uppercase">
              Étape {active + 1} sur {ETAPES_DEPOT.length}
            </span>
            <h3 className="mb-0 text-2xl text-primary-9">{etape.titre}</h3>
            <p className="mb-0 leading-relaxed text-primary-10">
              {etape.detail}
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-primary-10">
                Ce que vous faites :
              </span>
              <Actions etape={etape} className="text-[15px]" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-primary-10">
                Qui intervient :
              </span>
              <Intervenants etape={etape} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Frise verticale dépliable, sous `lg`. */
const EtapesMobile = () => {
  const [ouverte, setOuverte] = useState<number | null>(0);

  return (
    <ol className="lg:hidden flex flex-col p-0 m-0 list-none">
      {ETAPES_DEPOT.map((etape, index) => {
        const estOuverte = index === ouverte;
        const panneauId = `demarche-pcaet-etape-${index}`;
        return (
          <li
            key={etape.titre}
            className="grid grid-cols-[40px_minmax(0,1fr)] gap-3.5 p-0"
          >
            <div className="flex flex-col items-center">
              <Pastille
                numero={index + 1}
                etat={ouverte === null ? 'a-venir' : etatDe(index, ouverte)}
                className="flex-none size-10"
              />
              {index < DERNIERE && (
                <span
                  aria-hidden
                  className={classNames(
                    'flex-1 w-0.5 min-h-4 transition-colors duration-300',
                    {
                      'bg-primary-9': ouverte !== null && index < ouverte,
                      'bg-primary-3': ouverte === null || index >= ouverte,
                    }
                  )}
                />
              )}
            </div>
            <div className="flex flex-col gap-2 min-w-0 pb-4">
              <button
                type="button"
                aria-expanded={estOuverte}
                aria-controls={panneauId}
                onClick={() => setOuverte(estOuverte ? null : index)}
                className={classNames(
                  'min-h-10 text-left text-[17px] leading-snug text-primary-9',
                  {
                    'font-bold': estOuverte,
                    'font-medium': !estOuverte,
                  }
                )}
              >
                {etape.titre}
              </button>
              {estOuverte && (
                <div
                  id={panneauId}
                  className={classNames(
                    'flex flex-col gap-3 p-3.5 bg-primary-0 border border-primary-3 rounded-lg text-sm',
                    styles.detail
                  )}
                >
                  <p className="mb-0 text-sm leading-relaxed text-primary-10">
                    {etape.detail}
                  </p>
                  <Actions etape={etape} className="text-[13px]" />
                  <Intervenants etape={etape} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export const DemarchePcaetEtapesSection = () => {
  const {
    section,
    active,
    defile,
    peutDefiler,
    enPause,
    basculerPause,
    choisir,
  } = useDefilementEtapes();

  return (
    <Section containerClassName="pt-0">
      <div ref={section} className="flex flex-col items-center gap-8 lg:gap-16">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="mb-0 text-center">Les étapes de votre dépôt</h2>
          <p className="mb-0 text-primary-10 lg:text-[17px]">
            Vous retrouverez ces 5 étapes dans le panneau « Avancement » de
            votre espace.
          </p>
          {peutDefiler && (
            <Button
              variant="underlined"
              size="xs"
              icon={enPause ? 'play-line' : 'pause-line'}
              onClick={basculerPause}
              className="max-lg:hidden"
            >
              {enPause
                ? 'Reprendre le défilement des étapes'
                : 'Mettre en pause le défilement des étapes'}
            </Button>
          )}
        </div>
        <EtapesDesktop active={active} defile={defile} choisir={choisir} />
        <EtapesMobile />
      </div>
    </Section>
  );
};
