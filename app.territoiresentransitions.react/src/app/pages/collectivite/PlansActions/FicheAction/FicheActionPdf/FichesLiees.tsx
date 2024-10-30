import { format, isBefore, startOfToday } from 'date-fns';
import classNames from 'classnames';
import { FicheResume } from '@tet/api/plan-actions';
import { preset } from '@tet/ui';
import {
  BadgePriorite,
  BadgeStatut,
  Box,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from 'ui/export-pdf/components';
import {
  CalendarIcon,
  LoopLeftIcon,
  UserIcon,
} from 'ui/export-pdf/assets/icons';
import { generateTitle } from '../data/utils';
import { getTextFormattedDate } from '../utils';

const { colors } = preset.theme.extend;

type FicheLieeCardProps = {
  ficheLiee: FicheResume;
};

const FicheLieeCard = ({ ficheLiee }: FicheLieeCardProps) => {
  const {
    statut,
    niveauPriorite,
    titre,
    plans,
    pilotes,
    dateFinProvisoire: dateDeFin,
    ameliorationContinue,
    modifiedAt,
  } = ficheLiee;

  const hasPilotes = !!pilotes && pilotes.length > 0;
  const hasDateDeFin = !!dateDeFin;

  const isLate = hasDateDeFin && isBefore(new Date(dateDeFin), startOfToday());

  return (
    <Card wrap={false} gap={1.5} className="w-[32%] p-3">
      {/* Statut et niveau de priorité */}
      <Stack direction="row" gap={2}>
        {!!niveauPriorite && (
          <BadgePriorite priorite={niveauPriorite} size="sm" />
        )}
        {<BadgeStatut statut={statut ?? 'Sans statut'} size="sm" />}
      </Stack>

      <Stack gap={1}>
        {/* Titre de la fiche */}
        <Title variant="h6" className="leading-5 text-primary-8">
          {generateTitle(titre)}
        </Title>

        {/* Plans d'actions associés */}
        <Paragraph className="text-[0.7rem] text-grey-8 font-medium">
          {!!plans && plans[0] ? (
            <>
              {generateTitle(plans[0].nom)}
              {plans.length > 1 && (
                <Paragraph className="text-primary-8">
                  {' '}
                  +{plans.length - 1}
                </Paragraph>
              )}
            </>
          ) : (
            'Fiche non classée'
          )}
        </Paragraph>
      </Stack>

      <Stack className="mt-auto" gap={1}>
        {/* Pilotes et date de fin prévisionnelle */}
        {(hasPilotes || hasDateDeFin || ameliorationContinue) && (
          <Stack direction="row" gap={2}>
            {/* Personnes pilote */}
            {hasPilotes && (
              <Stack gap={1} direction="row" className="items-center">
                <UserIcon />
                <Paragraph className="text-[0.65rem]">
                  {pilotes[0].nom}
                  {pilotes.length > 1 && (
                    <Paragraph className="text-[0.65rem] text-primary-8">
                      {' '}
                      +{pilotes.length - 1}
                    </Paragraph>
                  )}
                </Paragraph>
              </Stack>
            )}

            {/* Date de fin prévisionnelle */}
            {!!dateDeFin && (
              <>
                {hasPilotes && <Box className="w-[0.5px] h-4 bg-primary-3" />}
                <Stack gap={1} direction="row" className="items-center">
                  <CalendarIcon fill={isLate ? colors.error[1] : undefined} />
                  <Paragraph
                    className={classNames('text-[0.65rem]', {
                      'text-error-1': isLate,
                    })}
                  >
                    {getTextFormattedDate({
                      date: dateDeFin,
                      shortMonth: true,
                    })}
                  </Paragraph>
                </Stack>
              </>
            )}

            {/* Action récurrente */}
            {!hasDateDeFin && ameliorationContinue && (
              <>
                {hasPilotes && <Box className="w-[0.5px] h-4 bg-primary-3" />}
                <Stack gap={1} direction="row" className="items-center">
                  <LoopLeftIcon />
                  <Paragraph className="text-[0.65rem]">Tous les ans</Paragraph>
                </Stack>
              </>
            )}
          </Stack>
        )}

        {/* Date de modification */}
        {!!modifiedAt && (
          <Stack gap={2}>
            <Divider className="h-[0.5px]" />
            <Paragraph className="text-[0.65rem] text-grey-6 font-medium italic">
              Modifié le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
            </Paragraph>
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

type FichesLieesProps = {
  fichesLiees: FicheResume[];
};

const FichesLiees = ({ fichesLiees }: FichesLieesProps) => {
  if (fichesLiees.length === 0) return null;

  return (
    <Card wrap={false}>
      <Title variant="h4" className="text-primary-8">
        Fiches des plans liées
      </Title>
      {fichesLiees.length > 0 && (
        <Stack gap={3} direction="row" className="flex-wrap">
          {fichesLiees.map((ficheLiee) => (
            <FicheLieeCard key={ficheLiee.id} ficheLiee={ficheLiee} />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default FichesLiees;
