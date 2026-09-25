import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { designTokens } from '@tet/design-tokens';
import type { Pertinence } from '@tet/domain/collectivites';
import { action } from 'storybook/actions';
import { XAxis, YAxis } from './axis';
import { Caption } from './caption';
import { MatrixChart, type MatrixPoint } from './matrix.chart';
import { Quadrant, type MatrixTone } from './quadrant';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

type Levier = {
  nom: string;
  potentiel: number;
  partMobilisee: number;
  pertinence: Pertinence;
};

const TONE_BY_PERTINENCE: Record<Pertinence, MatrixTone> = {
  pertinent: 'default',
  a_discuter: 'warning',
  non_pertinent: 'grey',
};

const toMatrixPoint = (levier: Levier): MatrixPoint => ({
  id: levier.nom,
  label: levier.nom,
  description: LOREM,
  x: levier.partMobilisee,
  y: levier.potentiel,
  tone: TONE_BY_PERTINENCE[levier.pertinence],
});

const LEVIERS: [nom: string, potentiel: number, partMobilisee: number][] = [
  ['Sobriété et isolation des bâtiments (tertiaire)', 107, 43],
  ['Véhicules électriques', 61, 34],
  ['Changement de chaudière à fioul (tertiaire)', 62, 53],
  ['Fret décarboné et multimodalité', 47, 57],
  ['Chaudières fioul + rénovation (résidentiel)', 41, 61],
  ['Efficacité et carburants décarbonés des véhicules privés', 36, 61],
  ['Captage de méthane dans les ISDND', 17, 29],
  ['Covoiturage', 18, 33],
  ['Changement de chaudière à gaz (tertiaire)', 25, 56],
  ['Chaudières gaz + rénovation (résidentiel)', 23, 61],
  ['Production industrielle', 36, 86],
  ['Sobriété logistique', 30, 90],
  ['Vélo et transports en commun', 22, 95],
  ['Sobriété des bâtiments (résidentiel)', 26, 46],
];

const toPoints = ({
  pertinents,
  aDiscuter,
}: {
  pertinents: readonly string[];
  aDiscuter: readonly string[];
}): MatrixPoint[] =>
  LEVIERS.map(([nom, potentiel, partMobilisee]) => {
    if (pertinents.includes(nom)) {
      return toMatrixPoint({ nom, potentiel, partMobilisee, pertinence: 'pertinent' });
    }
    if (aDiscuter.includes(nom)) {
      return toMatrixPoint({ nom, potentiel, partMobilisee, pertinence: 'a_discuter' });
    }
    return toMatrixPoint({ nom, potentiel, partMobilisee, pertinence: 'non_pertinent' });
  });

const POINTS = toPoints({ pertinents: [], aDiscuter: [] });

const CUT_AT_GAP = 70;
const CUT_MID_PACK = 50;
const Y_THRESHOLD = 36;
const Y_TOP = 120;
const X_FULL = 100;

const meta: Meta<typeof MatrixChart> = {
  component: MatrixChart,
  parameters: { storyshots: false },
  args: {
    data: POINTS,
    className: 'h-[29rem]',
    onPointSelected: action('onPointSelected'),
  },
  decorators: [(story) => <div className="w-[900px]">{story()}</div>],
};

export default meta;

type Story = StoryObj<typeof MatrixChart>;

export const OnlyTheAlertZoneIsNamed: Story = {
  args: {
    children: (
      <>
        <Caption>{'Leviers par potentiel et part déjà mobilisée'}</Caption>
        <XAxis
          name="Mobilisation"
          minLabel="Peu mobilisé"
          maxLabel="Très mobilisé"
        />
        <YAxis name="Potentiel" minLabel="Faible" maxLabel="Fort" />
        <Quadrant
          from={{ x: 0, y: Y_THRESHOLD }}
          to={{ x: CUT_AT_GAP, y: Y_TOP }}
          title="Angles morts"
          tone="warning"
        />
        <Quadrant from={{ x: 0, y: 0 }} to={{ x: CUT_AT_GAP, y: Y_THRESHOLD }} />
        <Quadrant
          from={{ x: CUT_AT_GAP, y: Y_THRESHOLD }}
          to={{ x: X_FULL, y: Y_TOP }}
        />
        <Quadrant
          from={{ x: CUT_AT_GAP, y: 0 }}
          to={{ x: X_FULL, y: Y_THRESHOLD }}
        />
      </>
    ),
  },
};

export const FourNamedQuadrants: Story = {
  args: {
    children: (
      <>
        <Caption>{'Leviers par potentiel et part déjà mobilisée'}</Caption>
        <XAxis
          name="Mobilisation"
          minLabel="Peu mobilisé"
          maxLabel="Très mobilisé"
        />
        <YAxis name="Potentiel" minLabel="Faible" maxLabel="Fort" />
        <Quadrant
          from={{ x: 0, y: Y_THRESHOLD }}
          to={{ x: CUT_AT_GAP, y: Y_TOP }}
          title="Angles morts"
          tone="warning"
        />
        <Quadrant
          from={{ x: 0, y: 0 }}
          to={{ x: CUT_AT_GAP, y: Y_THRESHOLD }}
          title="Faible enjeu"
          titleAnchor="bottomRight"
        />
        <Quadrant
          from={{ x: CUT_AT_GAP, y: Y_THRESHOLD }}
          to={{ x: X_FULL, y: Y_TOP }}
          title="Bien couvert"
        />
        <Quadrant
          from={{ x: CUT_AT_GAP, y: 0 }}
          to={{ x: X_FULL, y: Y_THRESHOLD }}
          title="Bien investi"
          tone="success"
          titleAnchor="bottomRight"
        />
      </>
    ),
  },
};

export const CutInTheMiddleOfThePack: Story = {
  args: {
    children: (
      <>
        <Caption>{'Leviers par potentiel et part déjà mobilisée'}</Caption>
        <XAxis
          name="Mobilisation"
          minLabel="Peu mobilisé"
          maxLabel="Très mobilisé"
        />
        <YAxis name="Potentiel" minLabel="Faible" maxLabel="Fort" />
        <Quadrant
          from={{ x: 0, y: Y_THRESHOLD }}
          to={{ x: CUT_MID_PACK, y: Y_TOP }}
          title="Angles morts"
          tone="warning"
        />
        <Quadrant
          from={{ x: CUT_MID_PACK, y: 0 }}
          to={{ x: X_FULL, y: Y_TOP }}
        />
      </>
    ),
  },
};

export const WithoutAxisMarkers: Story = {
  args: {
    children: (
      <Quadrant
        from={{ x: 0, y: Y_THRESHOLD }}
        to={{ x: CUT_AT_GAP, y: Y_TOP }}
        title="Angles morts"
        tone="warning"
      />
    ),
  },
};

export const WithPointTones: Story = {
  args: {
    data: toPoints({
      pertinents: [
        'Sobriété et isolation des bâtiments (tertiaire)',
        'Changement de chaudière à fioul (tertiaire)',
      ],
      aDiscuter: ['Véhicules électriques', 'Fret décarboné et multimodalité'],
    }),
    children: (
      <>
        <Caption>{'Leviers par potentiel et part déjà mobilisée'}</Caption>
        <XAxis
          name="Mobilisation"
          minLabel="Peu mobilisé"
          maxLabel="Très mobilisé"
        />
        <YAxis name="Potentiel" minLabel="Faible" maxLabel="Fort" />
        <Quadrant
          from={{ x: 0, y: Y_THRESHOLD }}
          to={{ x: CUT_AT_GAP, y: Y_TOP }}
          title="Angles morts"
          tone="warning"
        />
      </>
    ),
  },
};

export const OverriddenQuadrantColors: Story = {
  args: {
    children: (
      <>
        <Caption>{'Leviers par potentiel et part déjà mobilisée'}</Caption>
        <XAxis
          name="Mobilisation"
          minLabel="Peu mobilisé"
          maxLabel="Très mobilisé"
        />
        <YAxis name="Potentiel" minLabel="Faible" maxLabel="Fort" />
        <Quadrant
          from={{ x: 0, y: Y_THRESHOLD }}
          to={{ x: CUT_AT_GAP, y: Y_TOP }}
          title="Zone à surveiller"
          colors={{
            background: designTokens.colors.primary[2],
            title: designTokens.colors.primary[9],
          }}
        />
      </>
    ),
  },
};
