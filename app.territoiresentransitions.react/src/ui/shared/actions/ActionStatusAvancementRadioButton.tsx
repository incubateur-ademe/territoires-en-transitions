import {avancementLabels} from 'app/labels';
import * as R from 'ramda';
import type {Option, Options} from 'types';
import {AvancementRadioButton} from 'ui/shared/AvancementRadioButton';
import {BehaviorSubject, Observable, Subject, withLatestFrom} from 'rxjs';

import {
  ActionStatutRead,
  Avancement,
} from 'generated/dataLayer/action_statut_read';
import {actionStatutRepository} from 'core-logic/api/repositories/ActionStatutRepository';
import {map} from 'rxjs/operators';
import {ActionStatutWrite} from 'generated/dataLayer/action_statut_write';
import {Component} from 'react';

class ActionStatusAvancementRadioButtonBloc {
  private _statut: BehaviorSubject<ActionStatutRead | null>;
  private _avancementToSave: Subject<Avancement>;

  saveAvancement(avancement: Avancement) {
    this._avancementToSave.next(avancement);
  }

  get avancement(): Observable<Avancement> {
    return this._statut.pipe(
      map((statut: ActionStatutRead | null): Avancement | null => {
        return statut?.avancement ?? null;
      }),
      map((avancement: Avancement | null): Avancement => {
        const defaultAvancement: Avancement = 'non_renseigne';
        return avancement ?? defaultAvancement;
      })
    );
  }

  get concerne(): Observable<boolean> {
    return this._statut.pipe(
      map((statut: ActionStatutRead | null): boolean | null => {
        return statut?.concerne ?? null;
      }),
      map((concerne: boolean | null): boolean => {
        const defaultConcerne = true;
        return concerne ?? defaultConcerne;
      })
    );
  }

  saveConcerne(value: boolean | null) {
    // 1. write to store
    // 2. push to observable
  }

  private fetch() {
    actionStatutRepository
      .fetch({
        actionId: this.actionId,
        epciId: this.epciId,
      })
      .then(fetched => {
        if (fetched !== null) console.log('fetched: ', fetched);
        this._statut.next(fetched);
      });
  }

  private listenToAvancementChanges() {
    this._avancementToSave
      .pipe(
        withLatestFrom(this._statut),
        map(x => {
          console.log(x);
          const avancement = x[0];
          const statut = x[1]!; // todo default statut ?
          const updated: ActionStatutWrite = {
            action_id: statut.action_id,
            avancement: avancement,
            concerne: statut.concerne,
            epci_id: statut.epci_id,
          };
          return updated;
        })
      )
      .subscribe(avancement => {
        console.log(avancement);
        actionStatutRepository.save(avancement);
      });
  }

  private actionId: string;
  private epciId: number;

  constructor({actionId, epciId}: {epciId: number; actionId: string}) {
    console.log('constructor', actionId);
    this.actionId = actionId;
    this.epciId = epciId;
    this._statut = new BehaviorSubject<ActionStatutRead | null>(null);
    this._avancementToSave = new Subject<Avancement>();
  }

  dispose() {
    // console.log('dispose', this.actionId);
    this._statut.unsubscribe();
    this._avancementToSave.unsubscribe();
  }

  onMount() {
    this.listenToAvancementChanges();
    this.fetch();
  }
}

export class ActionStatusAvancementRadioButton extends Component<
  {
    actionId: string;
  },
  {
    avancement: Avancement;
    //concerne: boolean;
  }
> {
  private readonly bloc: ActionStatusAvancementRadioButtonBloc;

  constructor(props: {actionId: string}) {
    super(props);
    this.state = {avancement: 'non_renseigne'};
    this.bloc = new ActionStatusAvancementRadioButtonBloc({
      actionId: props.actionId,
      epciId: 1,
    });
  }

  componentDidMount() {
    this.bloc.onMount();
    console.log('this.bloc.avancement: ', this.bloc.avancement);
    this.bloc.avancement.subscribe(avancement => {
      this.setState({avancement: avancement});
    });
  }

  componentWillUnmount() {
    this.bloc.dispose();
  }

  render() {
    if (this.state.avancement === null) return null;

    const avancements: Options<Avancement> = R.values(
      R.mapObjIndexed((label, value) => ({value, label}), avancementLabels)
    );

    const optionWasChecked = ({option}: {option: Option<Avancement>}) =>
      option.value === this.state.avancement;

    const onClick = async ({option}: {option: Option<Avancement>}) => {
      const wasChecked = optionWasChecked({option});
      this.bloc?.saveAvancement(wasChecked ? 'non_renseigne' : option.value);
    };

    return (
      <AvancementRadioButton
        avancements={avancements}
        optionIsChecked={optionWasChecked}
        onClick={onClick}
      />
    );
  }
}
