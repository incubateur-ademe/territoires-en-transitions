import { reglesDeLaReprise } from './regles.content';
import { splitRegles } from './split-regles';

export const sectionsDesRegles = splitRegles(reglesDeLaReprise);

export const getSectionDeRegle = (numero: number) =>
  sectionsDesRegles.find((s) => s.numero === numero);

export const markdownClassName =
  'text-sm text-grey-9 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-primary-9 [&_table]:w-full [&_table]:text-left [&_td]:border-t [&_td]:border-grey-3 [&_td]:py-1 [&_td]:pr-3 [&_th]:pr-3 [&_th]:text-xs [&_th]:text-grey-8';
