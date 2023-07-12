import {ChangeEvent, useState} from 'react';
import SliderBase from '@material-ui/core/Slider';
import {withStyles} from '@material-ui/core/styles';
import {actionAvancementColors} from 'app/theme';
import TagFilters from '../filters/TagFilters';

export type AvancementValues = [number, number, number];
type SliderValues = [number, number];

export type TSliderProps = {
  value: AvancementValues;
  onChange: ([done, scheduled, notDone]: AvancementValues) => void;
};

const TRACK_HEIGHT = 6;

// version stylée du composant de base
const Slider = withStyles({
  root: {
    color: 'transparent',
    height: TRACK_HEIGHT,
    padding: 0,
  },
  thumb: {
    height: 20,
    width: 20,
    backgroundColor: '#666',
    border: 0,
    marginTop: -11,
    marginLeft: -10,
    boxShadow: '#ebebeb 0 2px 2px',
    '&:focus, &:hover, &:active': {
      boxShadow: '#ccc 0 2px 3px 1px',
    },
  },
  track: {
    height: TRACK_HEIGHT,
  },
  rail: {
    color: 'transparent',
    opacity: 1,
    height: TRACK_HEIGHT,
  },
  mark: {
    backgroundColor: '#bfbfbf',
    height: TRACK_HEIGHT,
    width: 1,
    marginTop: -3,
    // pour masquer la 1ère et la dernière graduation
    '&[data-index="0"], &[data-index="10"]': {
      visibility: 'hidden',
    },
  },
})(SliderBase);

// converti les valeurs du slider en un tableau de pourcentage
const sliderValuesToAvancement = ([
  value1,
  value2,
]: SliderValues): AvancementValues => {
  const done = value1;
  const scheduled = value2 - value1;
  const notDone = 100 - value2;
  return [done, scheduled, notDone];
};

const avancementToSliderValues = ([
  done,
  scheduled,
]: AvancementValues): SliderValues => [
  done * 100, // done
  (done + scheduled) * 100, // not done
];

// pas par défaut et pas étendu (de 25 en 25)
const DEFAULT_STEP_INC = 10;
const EXTENDED_STEP_INC = 25;

// valeurs initiales des statuts en fonction de la valeur de pas
const DEFAULT_VALUES_BY_STEP: Record<number, SliderValues> = {
  [DEFAULT_STEP_INC]: [30, 70],
  [EXTENDED_STEP_INC]: [25, 75],
};

// valeur initiale du pas en fonction des valeurs initiales des statuts
const getDefaultStep = (value: SliderValues) => {
  if (
    value[0] % EXTENDED_STEP_INC === 0 &&
    value[1] % EXTENDED_STEP_INC === 0
  ) {
    return EXTENDED_STEP_INC;
  }
  return DEFAULT_STEP_INC;
};

/**
 * Affiche le slider de définition de l'état d'avancement détaillé d'une tâche
 */
export const DetailedScoreSlider = (props: TSliderProps) => {
  const {value, onChange} = props;

  // valeur d'avancements en fonction des valeurs stockées dans la base
  const [currentValue, setCurrentValue] = useState<SliderValues>(
    avancementToSliderValues(value)
  );

  // valeur initiale du pas
  const [step, setStep] = useState(getDefaultStep(currentValue));

  // convesion entre les valeurs du curseurs et les valeurs d'avancement
  const [done, scheduled, notDone] = sliderValuesToAvancement(currentValue);

  // met à jour les valeurs courantes lorsque les curseurs sont bougés
  const handleChange = (
    e: ChangeEvent<{}> | null,
    newValue: number | number[]
  ) => {
    onChange(
      sliderValuesToAvancement(newValue as SliderValues).map(
        v => v / 100
      ) as AvancementValues
    );
    setCurrentValue(newValue as SliderValues);
  };

  // met à jour la valeur du pas et revient aux valeurs d'avancement par défaut
  // associées, lorsqu'un bouton radio est cliqué
  const handleChangeStep = (step: number) => {
    setStep(step);
    handleChange(null, DEFAULT_VALUES_BY_STEP[step]);
  };

  return (
    <div className="w-full">
      <TagFilters
        className="mb-14"
        options={[
          {
            value: `${EXTENDED_STEP_INC}`,
            label: `Pas de ${EXTENDED_STEP_INC} en ${EXTENDED_STEP_INC}`,
          },
          {
            value: `${DEFAULT_STEP_INC}`,
            label: `Pas de ${DEFAULT_STEP_INC} en ${DEFAULT_STEP_INC}`,
          },
        ]}
        defaultOption={`${step}`}
        onChange={value => handleChangeStep(parseInt(value))}
      />

      <div className="relative w-9/12 m-auto">
        <div
          className="absolute"
          style={{
            top: 9,
            left: 0,
            width: `${done}%`,
            height: TRACK_HEIGHT,
            borderRadius: '4px 0 0 4px',
            backgroundColor: actionAvancementColors.fait,
          }}
        />
        <div
          className="absolute"
          style={{
            top: 9,
            left: `${done}%`,
            width: `${scheduled}%`,
            height: TRACK_HEIGHT,
            backgroundColor: actionAvancementColors.programme,
          }}
        />
        <div
          className="absolute"
          style={{
            top: 9,
            left: `${done + scheduled}%`,
            width: `${notDone}%`,
            height: TRACK_HEIGHT,
            borderRadius: '0 4px 4px 0',
            backgroundColor: actionAvancementColors.pas_fait,
          }}
        />
        <Slider
          marks
          step={step}
          value={currentValue}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
