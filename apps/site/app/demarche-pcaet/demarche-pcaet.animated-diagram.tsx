'use client';

import { Icon } from '@tet/ui';
import classNames from 'classnames';
import { CSSProperties, ReactNode, useEffect, useRef, useState } from 'react';
import styles from './demarche-pcaet.module.css';

const delay = (secondes: number): CSSProperties => ({
  animationDelay: `${secondes}s`,
});

const FICHIERS = ['Documents', 'Diagnostic', "Programme d'actions"];
const DESTINATAIRES = ['DREAL', 'DDT', 'Région', 'ADEME'];
const HAUTEURS_GES = [100, 86, 72, 58, 46, 34];
const MEMBRES = [
  { initiales: 'CM', className: 'bg-primary-7 text-white' },
  { initiales: 'DG', className: 'bg-secondary-1 text-primary-10' },
  { initiales: 'ÉL', className: 'bg-success-1 text-white' },
  { initiales: '+', className: 'bg-primary-2 text-primary-9' },
];
const PLANS = ['Plan climat', 'Plan mobilité', 'Autres plans'];

/** Moments où chaque carte apparaît : le carrousel mobile les suit. */
const APPARITION_PILOTAGE = 2.55;
const APPARITION_COLLABORATION = 4.4;

const DESCRIPTION =
  "Schéma en 3 temps : 1. je dépose mon PCAET, qui est transmis par e-mail à la DREAL, la DDT, la Région et l'ADEME ; 2. je pilote mon plan avec des indicateurs et tableaux de bord ; 3. je collabore en transversalité avec mes équipes sur plusieurs plans ; puis je renouvelle mon plan en repartant du précédent.";

const Carte = ({
  numero,
  titre,
  className,
  style,
  children,
}: {
  numero: number;
  titre: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    aria-hidden
    style={style}
    className={classNames(
      'flex flex-col gap-3 p-4 bg-white border border-primary-3 rounded-[10px] shadow-[0_8px_24px_rgba(64,64,146,0.10)] text-primary-10',
      styles.fadeUp,
      className
    )}
  >
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center size-[22px] rounded-full bg-primary-9 text-white text-xs font-bold">
        {numero}
      </span>
      <span className="text-sm font-bold">{titre}</span>
    </div>
    {children}
  </div>
);

const CarteDepot = ({ className, style }: CarteProps) => (
  <Carte
    numero={1}
    titre="Je dépose mon PCAET"
    className={className}
    style={style}
  >
    {FICHIERS.map((fichier, index) => (
      <div
        key={fichier}
        className={classNames('flex items-center gap-2.5', styles.slideIn)}
        style={delay(0.3 + index * 0.12)}
      >
        <span className="flex flex-col flex-1 gap-1">
          <span className="text-[11px] font-medium">{fichier}</span>
          <span
            className={classNames(
              'relative h-[5px] w-full overflow-hidden rounded-sm bg-primary-2',
              styles.jauge
            )}
            style={delay(1.75 + index * 0.3)}
          >
            <span
              className={classNames(
                'absolute inset-y-0 left-0 rounded-sm',
                styles.jaugeRemplissage
              )}
              style={delay(0.45 + index * 0.3)}
            />
          </span>
        </span>
        <span
          className={classNames(
            'flex flex-none items-center justify-center size-4 rounded-full bg-success-1',
            styles.check
          )}
          style={delay(1.35 + index * 0.3)}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3.5"
          >
            <path
              d="M5 12l5 5 9-10"
              className={styles.draw}
              style={delay(1.5 + index * 0.3)}
            />
          </svg>
        </span>
      </div>
    ))}
    <div className="relative pt-[22px] border-t border-primary-2">
      <span
        className={classNames(
          'absolute left-0 top-1 flex items-center justify-center w-[22px] h-4 rounded-[3px] bg-primary-9',
          styles.mail
        )}
        style={delay(1.35)}
      >
        <svg
          width="14"
          height="10"
          viewBox="0 0 24 16"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinejoin="round"
        >
          <path d="M2 2l10 7 10-7" />
        </svg>
      </span>
      <div className="flex gap-[5px]">
        {DESTINATAIRES.map((destinataire, index) => (
          <span
            key={destinataire}
            className={classNames(
              'flex-1 py-[5px] px-0.5 text-center text-[10px] font-bold text-primary-9 bg-primary-0 border border-primary-3 rounded-md',
              styles.destinataire
            )}
            style={delay(1.55 + index * 0.2)}
          >
            {destinataire}
          </span>
        ))}
      </div>
    </div>
  </Carte>
);

const CartePilotage = ({ className, style }: CarteProps) => (
  <Carte
    numero={2}
    titre="Je pilote mon plan"
    className={className}
    style={style}
  >
    <div className="flex items-stretch gap-4">
      <div className="flex flex-col items-center gap-2">
        <div
          className={classNames(
            'relative size-[86px] rounded-full',
            styles.donut
          )}
          style={delay(4)}
        >
          <div
            className={classNames(
              'absolute -inset-px rounded-full',
              styles.donutMasque
            )}
            style={delay(2.95)}
          />
          <div className="absolute inset-4 rounded-full bg-white" />
        </div>
        <span className="text-[10px] font-bold">Actions</span>
      </div>
      <div className="flex flex-col flex-1 gap-2">
        <div className="relative flex items-end gap-[5px] h-[86px] border-b border-primary-3">
          {HAUTEURS_GES.map((hauteur, index) => (
            <span
              key={hauteur}
              className={classNames(
                'flex-1 rounded-t rounded-b-sm bg-gradient-to-b from-primary-7 to-primary-4',
                styles.bar
              )}
              style={{ height: `${hauteur}%`, ...delay(2.95 + index * 0.1) }}
            />
          ))}
          <span
            className={classNames(
              'absolute right-0 top-0 flex items-center gap-0.5 py-0.5 px-[5px] rounded-lg bg-success-2 text-[9px] font-bold text-success-1',
              styles.pop
            )}
            style={delay(3.7)}
          >
            <Icon icon="line-chart-line" size="2xs" />
            GES
          </span>
        </div>
        <span className="text-[10px] font-bold">Émissions du territoire</span>
      </div>
    </div>
  </Carte>
);

const CarteCollaboration = ({ className, style }: CarteProps) => (
  <Carte
    numero={3}
    titre="Je collabore en transversalité"
    className={className}
    style={style}
  >
    <div className="flex items-center gap-3">
      <div className="flex">
        {MEMBRES.map(({ initiales, className: couleurs }, index) => (
          <span
            key={initiales}
            className={classNames(
              'flex items-center justify-center size-[30px] rounded-full border-2 border-white text-[11px] font-bold',
              { '-ml-2': index > 0 },
              couleurs,
              styles.pop
            )}
            style={delay(4.75 + index * 0.15)}
          >
            {initiales}
          </span>
        ))}
      </div>
      <span
        className={classNames('text-[11px] text-grey-8', styles.slideIn)}
        style={delay(5.25)}
      >
        Équipes et élus
      </span>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {PLANS.map((plan, index) => (
        <span
          key={plan}
          className={classNames(
            'py-[3px] px-2 rounded-[10px] bg-primary-2 text-[10px] font-bold uppercase text-primary-9',
            styles.pop
          )}
          style={delay(5.45 + index * 0.15)}
        >
          {plan}
        </span>
      ))}
    </div>
  </Carte>
);

type CarteProps = { className?: string; style?: CSSProperties };

const Connecteur = ({
  className,
  animation,
  secondes,
}: {
  className: string;
  animation: string;
  secondes: number;
}) => (
  <div
    aria-hidden
    className={classNames(
      'absolute border-primary-4 border-dashed',
      animation,
      className
    )}
    style={delay(secondes)}
  />
);

/** Composition desktop : les trois cartes reliées, puis la boucle de renouvellement. */
const SchemaDesktop = () => (
  <div
    role="img"
    aria-label={DESCRIPTION}
    className="relative h-[490px] w-[580px]"
  >
    <Connecteur
      className="left-[250px] top-[92px] w-[60px] border-t-2"
      animation={styles.growX}
      secondes={2.35}
    />
    <Connecteur
      className="left-[400px] top-[178px] h-[150px] border-l-2"
      animation={styles.growY}
      secondes={3.9}
    />
    <Connecteur
      className="left-[70px] top-[420px] w-[70px] border-t-2"
      animation={styles.growXFromRight}
      secondes={5.9}
    />
    <Connecteur
      className="left-[70px] top-[265px] h-[155px] border-l-2"
      animation={styles.growYFromBottom}
      secondes={6.1}
    />
    <div
      aria-hidden
      className={classNames(
        'absolute left-[66px] top-[258px] z-[2] border-x-[5px] border-x-transparent border-b-[7px] border-b-primary-4',
        styles.pop
      )}
      style={delay(6.5)}
    />
    <div
      aria-hidden
      className={classNames(
        'absolute left-20 top-[284px] z-[2] flex items-center gap-1 whitespace-nowrap text-[11px] font-medium tracking-wide text-grey-8',
        styles.fade
      )}
      style={delay(6.6)}
    >
      <Icon icon="refresh-line" size="2xs" />
      renouvellement
    </div>

    <CarteDepot className="absolute left-0 top-5 w-[250px]" style={delay(0)} />
    <CartePilotage
      className="absolute right-0 top-0 w-[270px]"
      style={delay(APPARITION_PILOTAGE)}
    />
    <CarteCollaboration
      className="absolute left-[140px] bottom-0 w-[300px]"
      style={delay(APPARITION_COLLABORATION)}
    />
  </div>
);

const DIAPOSITIVES = [
  'Étape 1 : je dépose',
  'Étape 2 : je pilote',
  'Étape 3 : je collabore',
];

type Minuteurs = ReturnType<typeof setTimeout>[];

const defilerVers = (piste: HTMLDivElement | null, index: number) => {
  if (!piste) return;
  const cible = Math.max(0, Math.min(DIAPOSITIVES.length - 1, index));
  piste.scrollTo({ left: cible * piste.clientWidth, behavior: 'smooth' });
};

/** Carrousel mobile : avance seul au rythme des apparitions, s'arrête dès qu'on y touche. */
const SchemaCarrousel = () => {
  const piste = useRef<HTMLDivElement>(null);
  const minuteurs = useRef<Minuteurs>([]);
  const [courante, setCourante] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const auto: Minuteurs = [
      setTimeout(
        () => defilerVers(piste.current, 1),
        (APPARITION_PILOTAGE - 0.1) * 1000
      ),
      setTimeout(
        () => defilerVers(piste.current, 2),
        (APPARITION_COLLABORATION - 0.1) * 1000
      ),
    ];
    minuteurs.current = auto;
    return () => auto.forEach(clearTimeout);
  }, []);

  const arreterAuto = () => {
    minuteurs.current.forEach(clearTimeout);
    minuteurs.current = [];
  };

  const montrer = (index: number) => {
    arreterAuto();
    defilerVers(piste.current, index);
  };

  return (
    <div
      role="group"
      aria-roledescription="carrousel"
      aria-label="Schéma en 3 temps : déposer, piloter, collaborer, puis renouveler"
      className="flex flex-col gap-1.5 w-full max-w-md mx-auto"
    >
      <div
        ref={piste}
        onScroll={(event) => {
          const element = event.currentTarget;
          setCourante(
            Math.round(element.scrollLeft / Math.max(1, element.clientWidth))
          );
        }}
        onPointerDown={arreterAuto}
        onTouchStart={arreterAuto}
        className="flex items-stretch overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex flex-none basis-full snap-center flex-col justify-center px-1 pt-1.5 pb-3.5">
          <CarteDepot style={delay(0)} />
        </div>
        <div className="flex flex-none basis-full snap-center flex-col justify-center px-1 pt-1.5 pb-3.5">
          <CartePilotage style={delay(APPARITION_PILOTAGE)} />
        </div>
        <div className="flex flex-none basis-full snap-center flex-col justify-center gap-2.5 px-1 pt-1.5 pb-3.5">
          <CarteCollaboration style={delay(APPARITION_COLLABORATION)} />
          <button
            type="button"
            onClick={() => montrer(0)}
            className={classNames(
              'self-start flex items-center gap-1 text-xs font-medium text-grey-8',
              styles.fade
            )}
            style={delay(6.6)}
          >
            <Icon icon="refresh-line" size="2xs" />
            renouvellement : retour à l&apos;étape 1
          </button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1">
        <button
          type="button"
          aria-label="Étape précédente"
          onClick={() => montrer(courante - 1)}
          disabled={courante === 0}
          className="flex items-center justify-center size-11 rounded-full text-primary-9 disabled:opacity-30"
        >
          <Icon icon="arrow-left-s-line" />
        </button>
        {DIAPOSITIVES.map((libelle, index) => (
          <button
            key={libelle}
            type="button"
            aria-label={libelle}
            aria-current={courante === index ? 'step' : undefined}
            onClick={() => montrer(index)}
            className="flex items-center justify-center w-6 h-11"
          >
            <span
              className={classNames('h-2 rounded transition-all', {
                'w-[22px] bg-primary-9': courante === index,
                'w-2 bg-primary-3': courante !== index,
              })}
            />
          </button>
        ))}
        <button
          type="button"
          aria-label="Étape suivante"
          onClick={() => montrer(courante + 1)}
          disabled={courante === DIAPOSITIVES.length - 1}
          className="flex items-center justify-center size-11 rounded-full text-primary-9 disabled:opacity-30"
        >
          <Icon icon="arrow-right-s-line" />
        </button>
      </div>
    </div>
  );
};

export const DemarchePcaetSchemaAnime = () => (
  <>
    <div className="max-xl:hidden">
      <SchemaDesktop />
    </div>
    <div className="xl:hidden">
      <SchemaCarrousel />
    </div>
  </>
);
