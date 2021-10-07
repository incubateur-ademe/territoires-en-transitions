import {ActionReferentiel} from 'generated/models';
import {ActionReferentielScoreStorable} from 'storables';
import {useActionReferentielScore} from 'core-logic/hooks/actionReferentielScore';

export const CurrentEpciCompletionStar = ({
  action,
}: {
  action: ActionReferentiel;
}) => {
  const storableId = ActionReferentielScoreStorable.buildId(action.id);
  const score = useActionReferentielScore(storableId);
  const completion = ((score?.completion ?? 0) * 100).toFixed(2);
  const size = 20;

  // todo use a 🌟
  const containerStyle = {
    height: size,
    width: size,
    backgroundColor: 'gray',
  };
  const coloredStarStyle = {
    bottom: 0,
    height: `${completion}%`,
    width: size,
    backgroundColor: 'red',
  };

  return (
    <div>
      Le référentiel est renseigné à {completion}%
      <div style={containerStyle}>
        <div style={coloredStarStyle}>
          <div></div>
        </div>
      </div>
    </div>
  );
};
