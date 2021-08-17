import {ActionReferentielScore} from 'generated/models/action_referentiel_score';

export class ActionReferentielScoreStorable extends ActionReferentielScore {
  static buildId(action_id: string): string {
    return action_id;
  }

  get id(): string {
    return ActionReferentielScoreStorable.buildId(this.action_id);
  }
}
