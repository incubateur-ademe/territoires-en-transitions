import {
  CalendarIcon,
  LeafIcon,
  LoopLeftIcon,
  UserIcon,
} from '@/app/ui/export-pdf/assets/icons';
import {
  BadgePriorite,
  BadgeStatut,
  Box,
  Card,
  Divider,
  Paragraph,
  Stack,
  Title,
} from '@/app/ui/export-pdf/components';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { FicheResume } from '@/domain/plans/fiches';
import { preset } from '@/ui';
import classNames from 'classnames';
import { format, isBefore, startOfToday } from 'date-fns';
import { generateTitle } from '../../FicheAction/data/utils';

const { colors } = preset.theme.extend;

type FicheLieeCardProps = {
  ficheLiee: FicheResume;
};

const FicheLieeCard = ({ ficheLiee }: FicheLieeCardProps) => {
  const {
    statut,
    priorite,
    titre,
    plans,
    pilotes,
    dateFin,
    ameliorationContinue,
    services,
    modifiedAt,
  } = ficheLiee;

  const hasPilotes = !!pilotes && pilotes.length > 0;
  const hasDateDeFin = !!dateFin;
  const hasServices = !!services && services.length > 0;

  const isLate = hasDateDeFin && isBefore(new Date(dateFin), startOfToday());

  return (
    <Card wrap={false} gap={1.5} className="w-[49%] p-3">
      {/* Statut et niveau de priorité */}
      <Stack direction="row" gap={2}>
        {!!priorite && <BadgePriorite priorite={priorite} size="sm" />}
        {<BadgeStatut statut={statut ?? 'Sans statut'} size="sm" />}
      </Stack>

      <Stack gap={1} className="mb-1">
        {/* Titre de la fiche */}
        <Title variant="h6" className="leading-5 text-primary-9 mb-1">
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

      <Stack className="mt-auto" gap={2}>
        {/* Pilotes et date de fin prévisionnelle */}
        {(hasPilotes ||
          hasDateDeFin ||
          ameliorationContinue ||
          hasServices) && (
          <Stack direction="row" gap={2} className="flex-wrap">
            {/* Date de fin prévisionnelle */}
            {!!dateFin && (
              <Stack gap={1} direction="row" className="items-center">
                <CalendarIcon fill={isLate ? colors.error[1] : undefined} />
                <Paragraph
                  className={classNames('text-[0.65rem]', {
                    'text-error-1': isLate,
                  })}
                >
                  {getTextFormattedDate({
                    date: dateFin,
                    shortMonth: true,
                  })}
                </Paragraph>
              </Stack>
            )}

            {/* Action récurrente */}
            {!hasDateDeFin && ameliorationContinue && (
              <Stack gap={1} direction="row" className="items-center">
                <LoopLeftIcon />
                <Paragraph className="text-[0.65rem]">Tous les ans</Paragraph>
              </Stack>
            )}

            {/* Personnes pilote */}
            {hasPilotes && (
              <>
                {(hasDateDeFin || ameliorationContinue) && (
                  <Box className="w-[0.5px] h-4 bg-primary-3" />
                )}
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
              </>
            )}

            {/* Services pilotes */}
            {hasServices && (
              <>
                {(hasDateDeFin || ameliorationContinue || hasPilotes) && (
                  <Box className="w-[0.5px] h-4 bg-primary-3" />
                )}
                <Stack gap={1} direction="row" className="items-center">
                  <LeafIcon />
                  <Paragraph className="text-[0.65rem]">
                    {services[0].nom}
                    {services.length > 1 && (
                      <Paragraph className="text-[0.65rem] text-primary-8">
                        {' '}
                        +{services.length - 1}
                      </Paragraph>
                    )}
                  </Paragraph>
                </Stack>
              </>
            )}
          </Stack>
        )}

        {/* Date de modification */}
        {!!modifiedAt && (
          <Stack gap={1}>
            <Divider className="h-[0.5px]" />
            <Paragraph className="text-[0.65rem] text-grey-6 font-medium italic">
              Modifiée le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
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
    <Card>
      <Title variant="h4" className="text-primary-8">
        Fiches action liées
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
