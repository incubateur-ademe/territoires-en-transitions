import { useState } from 'react';
import {
  PollutantConfig,
  PollutantLetter,
  SectorConfig,
  SectorLetter,
} from './grid-model';
import {
  AIR_POLLUTANTS,
  AIR_SECTORS,
} from './polluants-atmospheriques.constants';

const move = <T,>(items: T[], from: number, to: number): T[] => {
  if (from === to) {
    return items;
  }
  const copy = [...items];
  const [element] = copy.splice(from, 1);
  copy.splice(to, 0, element);
  return copy;
};

const pollutantByLetter = new Map(
  AIR_POLLUTANTS.map((pollutant) => [pollutant.letter, pollutant])
);

const sectorByLetter = new Map(
  AIR_SECTORS.map((sector) => [sector.letter, sector])
);

export type GridLayout = {
  orderedSectors: SectorConfig[];
  orderedPollutants: PollutantConfig[];
  moveSector: (move: { from: number; to: number }) => void;
  movePollutant: (move: { from: number; to: number }) => void;
};

export const useGridLayout = (): GridLayout => {
  const [sectorOrder, setSectorOrder] = useState<SectorLetter[]>(
    AIR_SECTORS.map((sector) => sector.letter)
  );
  const [pollutantOrder, setPollutantOrder] = useState<PollutantLetter[]>(
    AIR_POLLUTANTS.map((pollutant) => pollutant.letter)
  );

  const orderedSectors = sectorOrder.flatMap((letter) => {
    const sector = sectorByLetter.get(letter);
    return sector ? [sector] : [];
  });

  const orderedPollutants = pollutantOrder.flatMap((letter) => {
    const pollutant = pollutantByLetter.get(letter);
    return pollutant ? [pollutant] : [];
  });

  const moveSector = ({ from, to }: { from: number; to: number }): void =>
    setSectorOrder((current) => move(current, from, to));

  const movePollutant = ({ from, to }: { from: number; to: number }): void =>
    setPollutantOrder((current) => move(current, from, to));

  return { orderedSectors, orderedPollutants, moveSector, movePollutant };
};
