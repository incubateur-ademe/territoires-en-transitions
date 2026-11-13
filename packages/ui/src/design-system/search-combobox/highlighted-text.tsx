import type { TextRange } from './search-combobox.types';

/** Découpe le texte en passages, surlignés ou non, sans chevauchement. */
export const splitHighlights = (
  text: string,
  ranges: readonly TextRange[] = []
): { text: string; isHighlighted: boolean }[] => {
  const marked = new Array<boolean>(text.length).fill(false);
  for (const [start, end] of ranges) {
    for (let i = Math.max(0, start); i < Math.min(end, text.length); i++) {
      marked[i] = true;
    }
  }
  const parts: { text: string; isHighlighted: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts.at(-1);
    if (last && last.isHighlighted === marked[i]) {
      last.text += text[i];
    } else {
      parts.push({ text: text[i], isHighlighted: marked[i] });
    }
  }
  return parts;
};

/**
 * Un texte dont certains passages ressortent en gras : l'emphase ne repose pas
 * sur la seule couleur.
 */
export const HighlightedText = ({
  text,
  ranges,
}: {
  text: string;
  ranges?: readonly TextRange[];
}) => (
  <>
    {splitHighlights(text, ranges).map((part, index) =>
      part.isHighlighted ? (
        <mark
          key={index}
          className="bg-primary-2 text-primary-10 font-bold rounded-sm"
        >
          {part.text}
        </mark>
      ) : (
        <span key={index}>{part.text}</span>
      )
    )}
  </>
);
