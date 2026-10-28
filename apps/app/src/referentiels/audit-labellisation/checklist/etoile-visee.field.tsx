import { appLabels } from '@/app/labels/catalog';
import { numLabels } from '@/app/referentiels/labellisations/numLabels';
import { Etoile, EtoileEnum } from '@tet/domain/referentiels';
import { Icon, VisibleWhen } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { ReactNode, useId, useState } from 'react';

const ETOILES = [1, 2, 3, 4, 5] as const satisfies readonly Etoile[];

type EtoileState = 'selected' | 'hovered' | 'empty';

const toEtoileState = ({
  star,
  value,
  hoveredStar,
}: {
  star: Etoile;
  value: Etoile;
  hoveredStar: Etoile | null;
}): EtoileState => {
  if (hoveredStar === null) {
    return star <= value ? 'selected' : 'empty';
  }
  if (star > hoveredStar) {
    return 'empty';
  }
  return star <= value ? 'selected' : 'hovered';
};

const isPremiereEtoileObtenue = ({
  star,
  etoilesObtenues,
}: {
  star: Etoile;
  etoilesObtenues: number;
}): boolean => star === EtoileEnum.PREMIERE_ETOILE && etoilesObtenues >= 1;

const EtoileIcon = ({
  state,
  isObtenue,
}: {
  state: EtoileState;
  isObtenue: boolean;
}): ReactNode => (
  <span className="relative inline-flex">
    <Icon
      icon={state === 'empty' ? 'star-line' : 'star-fill'}
      size="2xl"
      className={cn('text-primary-9', { 'opacity-50': state === 'hovered' })}
    />
    <VisibleWhen condition={isObtenue}>
      <Icon
        icon="checkbox-circle-fill"
        size="xs"
        className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white text-success"
      />
    </VisibleWhen>
  </span>
);

const toEtoileOptionLabel = ({
  star,
  isObtenue,
}: {
  star: Etoile;
  isObtenue: boolean;
}): string =>
  isObtenue
    ? appLabels.demarrerAuditEtoileObtenueOption({
        etoileLabel: numLabels[star],
      })
    : appLabels.demarrerAuditEtoileOption({ etoileLabel: numLabels[star] });

const EtoileViseeField = ({
  value,
  etoilesObtenues,
  onChange,
}: {
  value: Etoile;
  etoilesObtenues: number;
  onChange: (star: Etoile) => void;
}): ReactNode => {
  const questionId = useId();
  const [hoveredStar, setHoveredStar] = useState<Etoile | null>(null);

  return (
    <div className="flex items-center gap-3">
      <span id={questionId} className="font-medium text-primary-9">
        {appLabels.demarrerAuditChoixEtoile}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={questionId}
        className="flex items-center gap-1"
        onMouseLeave={() => setHoveredStar(null)}
      >
        {ETOILES.map((star) =>
          isPremiereEtoileObtenue({ star, etoilesObtenues }) ? (
            <span key={star} aria-hidden="true">
              <EtoileIcon state="selected" isObtenue />
            </span>
          ) : (
            <label
              key={star}
              className="cursor-pointer rounded has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-7"
              onMouseEnter={() => setHoveredStar(star)}
            >
              <input
                type="radio"
                name="etoile-visee"
                className="sr-only"
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
              />
              <span className="sr-only">
                {toEtoileOptionLabel({
                  star,
                  isObtenue: star <= etoilesObtenues,
                })}
              </span>
              <EtoileIcon
                state={toEtoileState({ star, value, hoveredStar })}
                isObtenue={star <= etoilesObtenues}
              />
            </label>
          )
        )}
      </div>
    </div>
  );
};

export { EtoileViseeField, toEtoileState };
