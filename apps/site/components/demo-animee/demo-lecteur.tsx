'use client';

import { Icon } from '@tet/ui';
import classNames from 'classnames';
import {
  PointerEvent,
  KeyboardEvent,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import styles from './demo-animee.module.css';
import { borner } from './timeline';
import { LectureDemo } from './use-lecture-demo';

export type ChapitreDemo = {
  libelle: string;
  /** Début du chapitre, en temps réel de lecture. */
  debut: number;
};

/** Pas des flèches du clavier sur la barre de lecture, en secondes. */
const PAS_CLAVIER = 2;

const formaterTemps = (secondes: number) =>
  `0:${String(Math.floor(secondes)).padStart(2, '0')}`;

/**
 * Lecteur d'une démo scénarisée : la scène est dessinée à taille fixe
 * (`largeur` × `hauteur`) puis réduite pour tenir dans la largeur disponible.
 */
export const DemoLecteur = ({
  lecture,
  largeur,
  hauteur,
  description,
  chapitres,
  compact = false,
  children,
}: {
  lecture: LectureDemo;
  largeur: number;
  hauteur: number;
  /** Ce que montre la démo, lu par les lecteurs d'écran. */
  description: string;
  chapitres: ChapitreDemo[];
  compact?: boolean;
  children: ReactNode;
}) => {
  const { conteneur, temps, duree, enLecture, deplacement } = lecture;
  const [echelle, setEchelle] = useState(0);
  const [survol, setSurvol] = useState(false);

  useEffect(() => {
    const element = conteneur.current;
    if (!element) return;
    const observateur = new ResizeObserver(([entree]) =>
      setEchelle(Math.min(1, entree.contentRect.width / largeur))
    );
    observateur.observe(element);
    return () => observateur.disconnect();
  }, [conteneur, largeur]);

  const bornes = [...chapitres.map(({ debut }) => debut), duree];
  const segments = chapitres.map((chapitre, index) => {
    const debut = bornes[index];
    const fin = bornes[index + 1];
    return {
      ...chapitre,
      poids: fin - debut,
      remplissage: borner((temps - debut) / (fin - debut), 0, 1),
      courant: temps >= debut && temps < fin,
    };
  });
  const segmentCourant = segments.find(({ courant }) => courant) ?? segments[0];

  const deplacerVers = (evenement: PointerEvent<HTMLDivElement>) => {
    const zone = evenement.currentTarget.getBoundingClientRect();
    const ratio = borner((evenement.clientX - zone.left) / zone.width, 0, 1);
    lecture.allerA(ratio * duree);
  };

  const gererClavier = (evenement: KeyboardEvent<HTMLDivElement>) => {
    const instants: Record<string, number> = {
      Home: 0,
      End: duree,
      ArrowLeft: temps - PAS_CLAVIER,
      ArrowRight: temps + PAS_CLAVIER,
    };
    if (!(evenement.key in instants)) return;
    evenement.preventDefault();
    lecture.allerA(instants[evenement.key]);
  };

  const libelleLecture = enLecture
    ? 'Mettre la démonstration en pause'
    : 'Lire la démonstration';

  return (
    <div ref={conteneur} className="flex flex-col gap-2.5 w-full">
      <div
        role="img"
        aria-label={description}
        onClick={lecture.basculerLecture}
        onMouseEnter={() => setSurvol(true)}
        onMouseLeave={() => setSurvol(false)}
        className={classNames(
          'relative mx-auto overflow-hidden cursor-pointer bg-grey-2 border border-primary-3 shadow-[0_10px_30px_rgba(64,64,146,0.12)]',
          compact ? 'rounded-xl' : 'rounded-[10px]',
          { invisible: echelle === 0 }
        )}
        style={{ width: largeur * echelle, height: hauteur * echelle }}
      >
        <div
          aria-hidden
          className="absolute left-0 top-0 origin-top-left overflow-hidden"
          style={{
            width: largeur,
            height: hauteur,
            transform: `scale(${echelle})`,
          }}
        >
          {children}
        </div>

        {!deplacement && (!enLecture || survol) && (
          <div
            aria-hidden
            className={classNames(
              'absolute inset-0 z-20 flex items-center justify-center pointer-events-none',
              enLecture ? 'bg-primary-10/[0.04]' : 'bg-white/20',
              styles.fonduRapide
            )}
          >
            {!enLecture && (
              <span className="absolute left-3 top-3 px-2.5 py-1 rounded-xl bg-primary-10 text-xs font-bold tracking-wide text-white">
                EN PAUSE
              </span>
            )}
            <span
              className={classNames(
                'flex items-center justify-center rounded-full bg-primary-10/60 text-white shadow-[0_8px_24px_rgba(0,0,0,0.15)]',
                compact ? 'size-14' : 'size-20',
                styles.pop
              )}
            >
              <Icon icon={enLecture ? 'pause-fill' : 'play-fill'} size="2xl" />
            </span>
            {survol && (
              <span className="absolute bottom-3.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-primary-10/70 text-xs font-bold text-white whitespace-nowrap">
                {enLecture
                  ? 'Cliquer pour mettre en pause'
                  : 'Cliquer pour reprendre'}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className="flex items-end gap-3 mx-auto"
        style={{ width: echelle ? largeur * echelle : '100%' }}
      >
        <button
          type="button"
          onClick={lecture.basculerLecture}
          aria-label={libelleLecture}
          className="flex flex-none items-center justify-center gap-1.5 min-w-11 h-11 px-3 rounded-full border border-primary-3 !bg-white text-[13px] font-bold text-primary-9"
        >
          <Icon icon={enLecture ? 'pause-fill' : 'play-fill'} size="sm" />
          {!compact && <span>{enLecture ? 'Pause' : 'Lecture'}</span>}
        </button>

        <div className="flex flex-col flex-1 gap-1 min-w-0">
          {compact ? (
            <span className="py-0.5 text-[11px] font-bold text-primary-9">
              {segmentCourant.libelle}
            </span>
          ) : (
            <div className="flex gap-[3px]">
              {segments.map((segment) => (
                <button
                  key={segment.libelle}
                  type="button"
                  onClick={() => lecture.allerA(segment.debut + 0.01)}
                  className={classNames(
                    'min-w-0 py-0.5 text-left text-xs truncate !bg-transparent',
                    segment.courant
                      ? 'font-bold text-primary-9'
                      : 'font-medium text-grey-8'
                  )}
                  style={{ flex: segment.poids }}
                >
                  {segment.libelle}
                </button>
              ))}
            </div>
          )}

          <div
            role="slider"
            tabIndex={0}
            aria-label="Position dans la démonstration"
            aria-valuemin={0}
            aria-valuemax={Math.round(duree)}
            aria-valuenow={Math.round(temps)}
            aria-valuetext={`${formaterTemps(temps)}, ${
              segmentCourant.libelle
            }`}
            onPointerDown={(evenement) => {
              evenement.currentTarget.setPointerCapture(evenement.pointerId);
              lecture.commencerDeplacement();
              deplacerVers(evenement);
            }}
            onPointerMove={(evenement) =>
              deplacement && deplacerVers(evenement)
            }
            onPointerUp={lecture.terminerDeplacement}
            onPointerCancel={lecture.terminerDeplacement}
            onKeyDown={gererClavier}
            className="relative h-[22px] rounded cursor-pointer touch-none"
          >
            <div className="absolute inset-x-0 top-1/2 flex gap-[3px] -translate-y-1/2 pointer-events-none">
              {segments.map((segment) => (
                <div
                  key={segment.libelle}
                  className={classNames(
                    'overflow-hidden rounded-sm bg-primary-3 transition-[height] duration-150',
                    deplacement ? 'h-[7px]' : 'h-[5px]'
                  )}
                  style={{ flex: segment.poids }}
                >
                  <div
                    className="h-full bg-primary-9"
                    style={{ width: `${segment.remplissage * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div
              className={classNames(
                'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary-9 shadow-[0_1px_4px_rgba(42,42,98,0.35)] pointer-events-none transition-[width,height] duration-150',
                deplacement ? 'size-[18px]' : 'size-3.5'
              )}
              style={{ left: `${(temps / duree) * 100}%` }}
            />
          </div>
        </div>

        <span className="flex-none pb-[3px] text-xs font-medium text-grey-8 tabular-nums">
          {formaterTemps(temps)} / {formaterTemps(duree)}
        </span>
      </div>
    </div>
  );
};
