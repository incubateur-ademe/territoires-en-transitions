import { DragEvent, useState } from 'react';

type Move = { from: number; to: number };

export type ReorderHandlers = {
  draggable: true;
  onDragStart: () => void;
  onDragOver: (event: DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

export const useReorder = (
  onMove: (move: Move) => void
): ((index: number) => ReorderHandlers) => {
  const [fromIndex, setFromIndex] = useState<number | null>(null);

  return (index) => ({
    draggable: true,
    onDragStart: () => setFromIndex(index),
    onDragOver: (event) => event.preventDefault(),
    onDrop: () => {
      if (fromIndex !== null) {
        onMove({ from: fromIndex, to: index });
      }
      setFromIndex(null);
    },
    onDragEnd: () => setFromIndex(null),
  });
};
