import {ChangeEvent, useState} from 'react';
import SliderBase from '@material-ui/core/Slider';
import {withStyles} from '@material-ui/core/styles';
import {actionAvancementColors} from 'app/theme';

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
    '&:focus, &:hover, &$active': {
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

/**
 * Affiche le slider de définition de l'état d'avancement détaillé d'une tâche
 */
export const DetailedScoreSlider = (props: TSliderProps) => {
  const {value, onChange} = props;
  const [currentValue, setCurrentValue] = useState<SliderValues>(
    avancementToSliderValues(value)
  );

  const handleChange = (e: ChangeEvent<{}>, newValue: number | number[]) => {
    onChange(
      sliderValuesToAvancement(newValue as SliderValues).map(
        v => v / 100
      ) as AvancementValues
    );
    setCurrentValue(newValue as SliderValues);
  };

  const [done, scheduled, notDone] = sliderValuesToAvancement(currentValue);

  return (
    <div className="w-full relative">
      <div
        className="absolute"
        style={{
          top: 10,
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
          top: 10,
          left: `${done}%`,
          width: `${scheduled}%`,
          height: TRACK_HEIGHT,
          backgroundColor: actionAvancementColors.programme,
        }}
      />
      <div
        className="absolute"
        style={{
          top: 10,
          left: `${done + scheduled}%`,
          width: `${notDone}%`,
          height: TRACK_HEIGHT,
          borderRadius: '0 4px 4px 0',
          backgroundColor: actionAvancementColors.pas_fait,
        }}
      />
      <Slider marks step={10} value={currentValue} onChange={handleChange} />
    </div>
  );
};
