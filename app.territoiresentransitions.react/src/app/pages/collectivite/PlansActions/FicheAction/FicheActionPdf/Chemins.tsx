import { preset } from '@tet/ui';
import { TAxeRow } from 'types/alias';
import { Paragraph, Stack } from 'ui/export-pdf/components';
import { ArrowRightIcon } from 'ui/export-pdf/assets/icons';
import { generateTitle } from '../data/utils';

const { colors } = preset.theme.extend;

type CheminsProps = {
  chemins: TAxeRow[][];
};

const Chemins = ({ chemins }: CheminsProps) => {
  return (
    <Stack gap={2}>
      {chemins.map((emplacement, index) => (
        <Stack key={index} gap={1} direction="row" className="flex-wrap">
          {emplacement.map((elt, i) => (
            <Stack
              key={i}
              gap={'px'}
              direction="row"
              className="flex-wrap items-end"
            >
              <Paragraph className="text-grey-6 text-[0.7rem] leading-5">
                {generateTitle(elt.nom)}
              </Paragraph>
              {i !== emplacement.length - 1 && (
                <ArrowRightIcon fill={colors.grey[6]} />
              )}
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  );
};

export default Chemins;
