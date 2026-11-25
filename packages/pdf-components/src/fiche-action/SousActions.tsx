import { FicheWithRelations, isFicheOnTime } from '@tet/domain/plans';
import { htmlToText } from '@tet/domain/utils';
import { View } from '@react-pdf/renderer';
import classNames from 'classnames';
import { format } from 'date-fns';
import { CalendarIcon, LoopLeftIcon } from '../assets/icons';
import {
  BadgeStatut,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from '../primitives';
import { tw } from '../primitives/utils';
import { preset } from '../ui-compat';
import { generateTitle } from './external-helpers';

const { colors } = preset.theme.extend;

// La description n'a pas de colonne : elle s'affiche sous la ligne, sur
// toute la largeur, pour qu'un texte long ne s'étire pas sur plusieurs pages.
const columns = [
  { title: 'Titre', width: 'w-[45%]' },
  { title: 'Statut', width: 'w-[17%]' },
  { title: 'Personne pilote', width: 'w-[20%]' },
  { title: 'Date de fin', width: 'w-[18%]' },
] as const;

const [titreCol, statutCol, piloteCol, dateFinCol] = columns;

const Cell = ({
  width,
  children,
}: {
  width: string;
  children?: React.ReactNode;
}) => <View style={tw(`${width} pr-2`)}>{children}</View>;

const DateFin = ({ sousAction }: { sousAction: FicheWithRelations }) => {
  const { dateFin, ameliorationContinue, statut } = sousAction;

  // Comme dans l'app : une action répétée tous les ans n'a pas de date de fin.
  if (ameliorationContinue) {
    return (
      <Stack gap={1} direction="row" className="items-center">
        <LoopLeftIcon fill={colors.grey[6]} />
        <Paragraph className="text-[0.6rem] text-grey-6">
          Tous les ans
        </Paragraph>
      </Stack>
    );
  }

  if (!dateFin) return null;

  const isLate = !isFicheOnTime({ dateFin, statut });

  return (
    <Stack gap={1} direction="row" className="items-center">
      <CalendarIcon fill={isLate ? colors.error[1] : undefined} />
      <Paragraph
        className={classNames('text-[0.6rem] text-primary-9', {
          'text-error-1': isLate,
        })}
      >
        {format(new Date(dateFin), 'dd/MM/yyyy')}
      </Paragraph>
    </Stack>
  );
};

const SousActionRow = ({
  sousAction,
  isLast,
}: {
  sousAction: FicheWithRelations;
  isLast: boolean;
}) => {
  const { titre, description, statut, pilotes } = sousAction;
  const descriptionText = description ? htmlToText(description).trim() : '';
  const hasPilotes = !!pilotes && pilotes.length > 0;

  const hasDescription = descriptionText.length > 0;

  return (
    <View
      style={tw(
        classNames('py-2 px-1', {
          'border-b-[0.5px] border-grey-3': !isLast,
        })
      )}
    >
      {/* La ligne ne reste pas seule en bas de page, sans le début de sa description. */}
      <View
        style={tw('flex flex-row')}
        wrap={false}
        minPresenceAhead={hasDescription ? 20 : 0}
      >
        <Cell width={titreCol.width}>
          <Paragraph className="text-primary-9 font-medium">
            {generateTitle(titre)}
          </Paragraph>
        </Cell>

        <Cell width={statutCol.width}>
          {/* Sans ce conteneur en ligne, le badge s'étire sur toute la colonne. */}
          <Stack direction="row">
            <BadgeStatut statut={statut ?? 'Sans statut'} size="sm" />
          </Stack>
        </Cell>

        <Cell width={piloteCol.width}>
          {hasPilotes && (
            <Paragraph className="text-primary-9">
              {pilotes[0].nom}
              {pilotes.length > 1 && (
                <Paragraph className="text-primary-8 font-bold">
                  {' '}
                  +{pilotes.length - 1}
                </Paragraph>
              )}
            </Paragraph>
          )}
        </Cell>

        <Cell width={dateFinCol.width}>
          <DateFin sousAction={sousAction} />
        </Cell>
      </View>

      {hasDescription && (
        <Paragraph className="text-[0.6rem] text-grey-8 mt-1 pl-2">
          {descriptionText}
        </Paragraph>
      )}
    </View>
  );
};

type SousActionsProps = {
  sousActions: FicheWithRelations[];
};

export const SousActions = ({ sousActions }: SousActionsProps) => {
  if (sousActions.length === 0) return null;

  return (
    <>
      <Divider className="mt-2" />
      <Stack>
        {/* Le titre et l'en-tête du tableau ne restent jamais seuls en bas de page. */}
        <Title
          variant="h5"
          className="text-primary-8 uppercase"
          minPresenceAhead={60}
        >
          Sous-actions
        </Title>

        <Card gap={0} className="w-full px-2 py-1">
          <View
            style={tw('flex flex-row py-2 px-1 border-b-[0.5px] border-grey-3')}
            minPresenceAhead={30}
          >
            {columns.map(({ title, width }) => (
              <Cell key={title} width={width}>
                <Paragraph className="text-[0.55rem] text-grey-8 uppercase">
                  {title}
                </Paragraph>
              </Cell>
            ))}
          </View>

          {sousActions.map((sousAction, index) => (
            <SousActionRow
              key={sousAction.id}
              sousAction={sousAction}
              isLast={index === sousActions.length - 1}
            />
          ))}
        </Card>
      </Stack>
    </>
  );
};
