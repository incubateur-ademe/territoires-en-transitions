type ResolveTarget = () => HTMLElement | null;

type Unregister = () => void;

type RegisterArgs = {
  tourId: string;
  targetId: string;
  element: HTMLElement;
};

type GuidedTourRegistry = {
  register: (args: RegisterArgs) => Unregister;
  resolve: (tourId: string, targetId: string) => ResolveTarget;
};

type ElementsByTour = Map<string, Map<string, Set<HTMLElement>>>;

const byDocumentOrder = (first: HTMLElement, second: HTMLElement): number => {
  if (first === second) {
    return 0;
  }
  const isFirstBeforeSecond = Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  );
  return isFirstBeforeSecond ? -1 : 1;
};

const ensureElements = ({
  elementsByTour,
  tourId,
  targetId,
}: {
  elementsByTour: ElementsByTour;
  tourId: string;
  targetId: string;
}): Set<HTMLElement> => {
  const elementsByTarget =
    elementsByTour.get(tourId) ?? new Map<string, Set<HTMLElement>>();
  const elements = elementsByTarget.get(targetId) ?? new Set<HTMLElement>();
  elementsByTarget.set(targetId, elements);
  elementsByTour.set(tourId, elementsByTarget);
  return elements;
};

const createGuidedTourRegistry = (): GuidedTourRegistry => {
  const elementsByTour: ElementsByTour = new Map();

  const register = ({
    tourId,
    targetId,
    element,
  }: RegisterArgs): Unregister => {
    const elements = ensureElements({ elementsByTour, tourId, targetId });
    elements.add(element);
    return () => {
      elements.delete(element);
    };
  };

  const resolve =
    (tourId: string, targetId: string): ResolveTarget =>
    () => {
      const elements = elementsByTour.get(tourId)?.get(targetId) ?? [];
      const [first] = [...elements].sort(byDocumentOrder);
      return first ?? null;
    };

  return { register, resolve };
};

export { createGuidedTourRegistry };
export type { GuidedTourRegistry, ResolveTarget };
