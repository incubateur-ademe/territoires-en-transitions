import { AxeLight } from '@tet/domain/plans';
import { ArrowRightIcon } from '../../../assets/icons';
import { Paragraph, Stack } from '../../../primitives';
import { preset } from '../../../ui-compat';
import { generateTitle } from '../../external-helpers';

const { colors } = preset.theme.extend;

type CheminsProps = {
  chemins: AxeLight[][];
};

export const Chemins = ({ chemins }: CheminsProps) => {
  return (
    <Stack gap={1}>
      {chemins.length > 0 ? (
        chemins.map((emplacement, index) => (
          <Stack key={index} gap={0.5} direction="row" className="flex-wrap">
            {emplacement.map((elt, i) => (
              <Stack
                key={i}
                gap="px"
                direction="row"
                className="flex-wrap items-end"
              >
                <Paragraph className="text-grey-7 text-[0.5rem]">
                  {generateTitle(elt.nom)}
                </Paragraph>
                {i !== emplacement.length - 1 && (
                  <ArrowRightIcon fill={colors.grey[6]} />
                )}
              </Stack>
            ))}
          </Stack>
        ))
      ) : (
        <Paragraph className="text-grey-7 text-[0.5rem]">
          Action non classée
        </Paragraph>
      )}
    </Stack>
  );
};
