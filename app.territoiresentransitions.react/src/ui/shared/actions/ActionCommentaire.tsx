import React from 'react';
import '../CrossExpandPanel.css';
import {ActionCommentaireRead} from 'generated/dataLayer/action_commentaire_read';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {actionCommentaireRepository} from 'core-logic/api/repositories/ActionCommentaireRepository';
import {map} from 'rxjs/operators';

export class ActionCommentaire extends React.Component<
  {actionId: string},
  {fieldValue: string}
> {
  private readonly bloc: ActionCommentaireBloc;

  constructor(props: {actionId: string}) {
    super(props);
    this.state = {fieldValue: ''};
    this.bloc = new ActionCommentaireBloc({
      actionId: props.actionId,
      epciId: 1,
    });
  }

  componentDidMount() {
    this.bloc.onMount();
    this.bloc.commentaireFieldValue.subscribe(fieldValue =>
      this.setState({fieldValue})
    );
  }

  componentWillUnmount() {
    this.bloc.dispose();
  }

  render() {
    return (
      <div className={' border-gray-300'}>
        <div className="CrossExpandPanel">
          <details>
            <summary className="title">Commentaire</summary>

            <textarea
              defaultValue={this.state.fieldValue}
              onBlur={evt => this.bloc.saveFieldValue(evt.target.value)}
              className="fr-input mt-2 w-full bg-white p-3 mr-5"
            />
          </details>
        </div>
      </div>
    );
  }
}

class ActionCommentaireBloc {
  private epciId: number;
  private actionId: string;
  private _commentaire: BehaviorSubject<ActionCommentaireRead | null>;
  private _fieldValueToSave: Subject<string>;

  constructor({actionId, epciId}: {epciId: number; actionId: string}) {
    this.actionId = actionId;
    this.epciId = epciId;
    this._commentaire = new BehaviorSubject<ActionCommentaireRead | null>(null);
    this._fieldValueToSave = new Subject<string>();
  }

  get commentaireFieldValue(): Observable<string> {
    return this._commentaire.pipe(
      map((commentaire: ActionCommentaireRead | null) => {
        return commentaire !== null ? commentaire.commentaire : '';
      })
    );
  }

  saveFieldValue(fieldValue: string) {
    this._fieldValueToSave.next(fieldValue);
  }

  private fetch() {
    actionCommentaireRepository
      .fetch({
        epciId: this.epciId,
        actionId: this.actionId,
      })
      .then(fetched => {
        this._commentaire.next(fetched);
      });
  }

  private listenToFieldValueChanges() {
    this._fieldValueToSave;
  }

  onMount() {
    this.listenToFieldValueChanges();
    this.fetch();
  }

  dispose() {
    this._commentaire.unsubscribe();
    this._fieldValueToSave.unsubscribe();
  }
}
