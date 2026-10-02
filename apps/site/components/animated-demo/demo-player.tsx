'use client';

import { Icon } from '@tet/ui';
import classNames from 'classnames';
import {
  KeyboardEvent,
  PointerEvent,
  ReactNode,
  useEffect,
  useState,
} from 'react';
import styles from './animated-demo.module.css';
import { clamp } from './timeline';
import { DemoPlayback } from './use-demo-playback';

export type DemoChapter = {
  label: string;
  /** Début du chapitre, en temps réel de lecture. */
  start: number;
};

/** Pas des flèches du clavier sur la barre de lecture, en secondes. */
const KEYBOARD_STEP_SECONDS = 2;

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(
    2,
    '0'
  )}`;

/**
 * Lecteur d'une démo scénarisée : la scène est dessinée à taille fixe
 * (`width` × `height`) puis réduite pour tenir dans la largeur disponible.
 */
export const DemoPlayer = ({
  playback,
  width,
  height,
  description,
  chapters,
  compact = false,
  children,
}: {
  playback: DemoPlayback;
  width: number;
  height: number;
  /** Ce que montre la démo, lu par les lecteurs d'écran. */
  description: string;
  chapters: DemoChapter[];
  compact?: boolean;
  children: ReactNode;
}) => {
  const { containerRef, time, duration, isPlaying, isScrubbing } = playback;
  const [scale, setScale] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setScale(Math.min(1, entry.contentRect.width / width))
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, width]);

  const bounds = [...chapters.map(({ start }) => start), duration];
  const segments = chapters.map((chapter, index) => {
    const start = bounds[index];
    const end = bounds[index + 1];
    return {
      ...chapter,
      weight: end - start,
      fill: clamp((time - start) / (end - start), 0, 1),
      isCurrent: time >= start && time < end,
    };
  });
  const currentSegment =
    segments.find(({ isCurrent }) => isCurrent) ?? segments[0];

  const seekToPointer = (event: PointerEvent<HTMLDivElement>) => {
    const area = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - area.left) / area.width, 0, 1);
    playback.seek(ratio * duration);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const targets: Record<string, number> = {
      Home: 0,
      End: duration,
      ArrowLeft: time - KEYBOARD_STEP_SECONDS,
      ArrowRight: time + KEYBOARD_STEP_SECONDS,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    playback.seek(targets[event.key]);
  };

  // Le survol n'a de sens qu'à la souris : un toucher ne déclenche jamais de sortie.
  const setHoverFromPointer =
    (hovered: boolean) => (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse') setIsHovered(hovered);
    };

  const playbackLabel = isPlaying
    ? 'Mettre la démonstration en pause'
    : 'Lire la démonstration';

  return (
    <div ref={containerRef} className="flex flex-col gap-2.5 w-full">
      <div
        role="img"
        aria-label={description}
        onClick={playback.togglePlayback}
        onPointerEnter={setHoverFromPointer(true)}
        onPointerLeave={setHoverFromPointer(false)}
        className={classNames(
          'relative mx-auto overflow-hidden cursor-pointer bg-grey-2 border border-primary-3 shadow-[0_10px_30px_rgba(64,64,146,0.12)]',
          compact ? 'rounded-xl' : 'rounded-[10px]',
          { invisible: scale === 0 }
        )}
        style={{ width: width * scale, height: height * scale }}
      >
        <div
          aria-hidden
          className={classNames(
            'absolute left-0 top-0 origin-top-left overflow-hidden',
            { [styles.paused]: !isPlaying }
          )}
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>

        {!isScrubbing && (!isPlaying || isHovered) && (
          <div
            aria-hidden
            className={classNames(
              'absolute inset-0 z-20 flex items-center justify-center pointer-events-none',
              isPlaying ? 'bg-primary-10/[0.04]' : 'bg-white/20',
              styles.fadeFast
            )}
          >
            {!isPlaying && (
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
              <Icon icon={isPlaying ? 'pause-fill' : 'play-fill'} size="2xl" />
            </span>
            {isHovered && (
              <span className="absolute bottom-3.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-primary-10/70 text-xs font-bold text-white whitespace-nowrap">
                {isPlaying
                  ? 'Cliquer pour mettre en pause'
                  : 'Cliquer pour reprendre'}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className="flex items-end gap-3 mx-auto"
        style={{ width: scale ? width * scale : '100%' }}
      >
        <button
          type="button"
          onClick={playback.togglePlayback}
          aria-label={playbackLabel}
          className="flex flex-none items-center justify-center gap-1.5 min-w-11 h-11 px-3 rounded-full border border-primary-3 !bg-white text-[13px] font-bold text-primary-9"
        >
          <Icon icon={isPlaying ? 'pause-fill' : 'play-fill'} size="sm" />
          {!compact && <span>{isPlaying ? 'Pause' : 'Lecture'}</span>}
        </button>

        <div className="flex flex-col flex-1 gap-1 min-w-0">
          {compact ? (
            <span className="py-0.5 text-[11px] font-bold text-primary-9">
              {currentSegment.label}
            </span>
          ) : (
            <div className="flex gap-[3px]">
              {segments.map((segment) => (
                <button
                  key={segment.label}
                  type="button"
                  onClick={() => playback.seek(segment.start + 0.01)}
                  className={classNames(
                    'min-w-0 py-0.5 text-left text-xs truncate !bg-transparent',
                    segment.isCurrent
                      ? 'font-bold text-primary-9'
                      : 'font-medium text-grey-8'
                  )}
                  style={{ flex: segment.weight }}
                >
                  {segment.label}
                </button>
              ))}
            </div>
          )}

          <div
            role="slider"
            tabIndex={0}
            aria-label="Position dans la démonstration"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(time)}
            aria-valuetext={`${formatTime(time)}, ${currentSegment.label}`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              playback.startScrubbing();
              seekToPointer(event);
            }}
            onPointerMove={(event) => isScrubbing && seekToPointer(event)}
            onPointerUp={playback.stopScrubbing}
            onPointerCancel={playback.stopScrubbing}
            onKeyDown={handleKeyDown}
            className="relative h-[22px] rounded cursor-pointer touch-none"
          >
            <div className="absolute inset-x-0 top-1/2 flex gap-[3px] -translate-y-1/2 pointer-events-none">
              {segments.map((segment) => (
                <div
                  key={segment.label}
                  className={classNames(
                    'overflow-hidden rounded-sm bg-primary-3 transition-[height] duration-150',
                    isScrubbing ? 'h-[7px]' : 'h-[5px]'
                  )}
                  style={{ flex: segment.weight }}
                >
                  <div
                    className="h-full bg-primary-9"
                    style={{ width: `${segment.fill * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div
              className={classNames(
                'absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary-9 shadow-[0_1px_4px_rgba(42,42,98,0.35)] pointer-events-none transition-[width,height] duration-150',
                isScrubbing ? 'size-[18px]' : 'size-3.5'
              )}
              style={{ left: `${(time / duration) * 100}%` }}
            />
          </div>
        </div>

        <span className="flex-none pb-[3px] text-xs font-medium text-grey-8 tabular-nums">
          {formatTime(time)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
