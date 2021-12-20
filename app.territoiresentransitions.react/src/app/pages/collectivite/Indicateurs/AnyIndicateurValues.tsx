import React, {useState} from 'react';
import {Editable} from 'ui/shared';
import {makeAutoObservable} from 'mobx';
import {AnyIndicateurValueGetParams} from 'core-logic/api/endpoints/AnyIndicateurValueReadEndpoint';
import {observer} from 'mobx-react-lite';
import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {AnyIndicateurValueWrite} from 'generated/dataLayer/any_indicateur_value_write';
import {useCollectiviteId} from 'core-logic/hooks';

// Here we take advantage of IndicateurPersonnaliseValue and IndicateurValue
// having the same shape.

export class AnyIndicateurValueInputBloc {
  private _endpoint: DataLayerReadEndpoint<
    AnyIndicateurValueWrite,
    AnyIndicateurValueGetParams
  >;
  private _indicateurId: string;
  private _collectiviteId: number;
  private _year: number;

  valeur?: number;

  constructor({
    indicateurId,
    collectiviteId,
    year,
    endpoint,
  }: {
    collectiviteId: number;
    indicateurId: string;
    year: number;
    endpoint: DataLayerReadEndpoint<
      AnyIndicateurValueWrite,
      AnyIndicateurValueGetParams
    >;
  }) {
    makeAutoObservable(this);
    this._indicateurId = indicateurId;
    this._collectiviteId = collectiviteId;
    this._year = year;
    this._endpoint = endpoint;
    this.fetch();
  }
  private fetch() {
    // console.log('collectiviteId : ', this._collectiviteId);
    this._endpoint
      .getBy({
        annee: this._year,
        indicateurId: this._indicateurId,
        collectiviteId: this._collectiviteId,
      })
      .then(fetched => {
        if (fetched[0]) {
          this.setValeur(fetched[0].valeur);
          console.log('fetched : ', fetched[0]);
        }
      });
  }
  private setValeur(valeur: number) {
    this.valeur = valeur;
  }
  get year() {
    return this._year;
  }
  get indicateurId() {
    return this._indicateurId;
  }
}

/**
 * Use IndicateurValuesStorageInterface + year to read/write an indicateur value
 */
const AnyIndicateurValueInput = observer(
  ({
    bloc,
    borderColor = 'gray',
  }: {
    bloc: AnyIndicateurValueInputBloc;
    borderColor?: 'blue' | 'gray';
  }) => {
    // = observer(({
    //   bloc,
    //   borderColor = 'gray',
    // }: {
    //   bloc: AnyIndicateurValueInputBloc,
    //   borderColor?: 'blue' | 'gray';
    // }) => {
    // const collectiviteId = useCollectiviteId()!;
    // const [inputValue, setInputValue] = useState<string | number>('');
    // const valueIndicateurUid = inferValueIndicateurUid(bloc.indicateurId);

    // const storableId = AnyIndicateurValueStorable.buildId(
    //   collectiviteId.toString(),
    //   valueIndicateurUid,
    //   bloc.year
    // );

    // useEffect(() => {
    //   store.retrieveById(storableId).then(storable => {
    //     setInputValue(storable?.value || '');
    //   });
    // }, []);

    const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value;

      const floatValue = parseFloat(inputValue.replace(',', '.'));
      console.log('should save ', floatValue);
      // commands.indicateurCommands.storeAnyIndicateurValue({
      //   store: store,
      //   interface: {
      //     epci_id: collectiviteId.toString(),
      //     indicateur_id: valueIndicateurUid,
      //     year: bloc.annee,
      //     value: floatValue,
      //   },
      // });
      // setInputValue(floatValue ? floatValue.toString() : '');
    };

    return (
      <label className="flex flex-col mx-2 j">
        <div className="flex pl-2 justify-center">{bloc.year}</div>
        <input
          className={`text-right fr-input mt-2 w-full bg-white p-3 border-b-2 text-sm font-normal text-gray-500 ${
            borderColor === 'blue' ? 'border-bf500' : 'border-gray-500'
          }`}
          value={bloc.valeur}
          onChange={handleChange}
        />
      </label>
    );
  }
);

type AnyIndicateurValuesProps = {
  borderColor?: 'blue' | 'gray';
  indicateurId: string;
  readEndpoint: DataLayerReadEndpoint<
    AnyIndicateurValueWrite,
    AnyIndicateurValueGetParams
  >;
};
/**
 * Display a range of inputs for every indicateur yearly values.
 */
export const AnyIndicateurValues = ({
  borderColor,
  indicateurId,
  readEndpoint,
}: AnyIndicateurValuesProps) => {
  const min = 2008;
  const stride = 2;
  const window = 7;
  const [index, setIndex] = useState<number>(4);

  const collectiviteId = useCollectiviteId();
  if (collectiviteId === null) return <h1>nope</h1>;

  const years = Array.from(
    {length: window},
    (v, k) => k + min + stride * index
  );
  const blocs = years.map(
    year =>
      new AnyIndicateurValueInputBloc({
        indicateurId,
        collectiviteId,
        year,
        endpoint: readEndpoint,
      })
  );

  return (
    <div className="flex row items-center h-full text-center">
      <button
        className="fr-fi-arrow-left-line fr-btn--icon-left"
        onClick={e => {
          e.preventDefault();
          setIndex(index - 1);
        }}
        disabled={index < 1}
      />
      <div className="flex row items-center">
        {blocs.map(bloc => (
          <AnyIndicateurValueInput
            key={`${bloc.indicateurId}-${bloc.year}`}
            borderColor={borderColor}
            bloc={bloc}
          />
        ))}
      </div>
      <button
        className="fr-fi-arrow-right-line fr-btn--icon-left pl-4"
        onClick={e => {
          e.preventDefault();
          setIndex(index + 1);
        }}
      />
    </div>
  );
};

/**
 * Expand Panel with range of value inputs as details
 */
export const AnyIndicateurEditableExpandPanel = ({
  title,
  editable,
  borderColor,
  indicateurId,
  readEndpoint: endpoint,
}: AnyIndicateurValuesProps & {
  title: string;
  editable?: boolean;
}) => (
  <div className="CrossExpandPanel">
    <details>
      <summary className="title">
        {editable ? <Editable text={title} /> : <div>{title}</div>}
      </summary>{' '}
      <div>
        <AnyIndicateurValues
          borderColor={borderColor}
          indicateurId={indicateurId}
          readEndpoint={endpoint}
        />
      </div>
    </details>
  </div>
);
