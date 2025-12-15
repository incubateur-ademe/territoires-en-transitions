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
import { FicheWithRelations } from '@tet/domain/plans';
import { preset } from '@tet/ui';
import classNames from 'classnames';
import { format, isBefore, startOfToday } from 'date-fns';
import { generateTitle } from '../../../../../utils';

const { colors } = preset.theme.extend;

type FicheLieeCardProps = {
  ficheLiee: FicheWithRelations;
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
    <Card wrap={false} gap={1} className="w-[49%] p-3">
      {/* Statut et niveau de priorité */}
      <Stack direction="row" gap={1.5}>
        {!!priorite && <BadgePriorite priorite={priorite} size="sm" />}
        {<BadgeStatut statut={statut ?? 'Sans statut'} size="sm" />}
      </Stack>

      <Stack gap={1.5} className="mb-1">
        {/* Titre de la fiche */}
        <Title variant="h6" className="text-primary-9">
          {generateTitle(titre)}
        </Title>

        {/* Plans d'actions associés */}
        <Paragraph className="text-grey-8 font-medium">
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
            'Action non classée'
          )}
        </Paragraph>
      </Stack>

      <Stack className="mt-auto" gap={1}>
        {/* Pilotes et date de fin prévisionnelle */}
        {(hasPilotes ||
          hasDateDeFin ||
          ameliorationContinue ||
          hasServices) && (
          <Stack direction="row" gap={1.5} className="flex-wrap">
            {/* Date de fin prévisionnelle */}
            {!!dateFin && (
              <Stack gap={1} direction="row" className="items-center">
                <CalendarIcon fill={isLate ? colors.error[1] : undefined} />
                <Paragraph
                  className={classNames('text-[0.6rem]', {
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
                <Paragraph className="text-[0.6rem]">Tous les ans</Paragraph>
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
                  <Paragraph className="text-[0.6rem]">
                    {pilotes[0].nom}
                    {pilotes.length > 1 && (
                      <Paragraph className="text-[0.6rem] text-primary-8">
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
                  <Paragraph className="text-[0.6rem]">
                    {services[0].nom}
                    {services.length > 1 && (
                      <Paragraph className="text-[0.6rem] text-primary-8">
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
            <Paragraph className="text-[0.6rem] text-grey-6 font-medium italic">
              Modifiée le {format(new Date(modifiedAt), 'dd/MM/yyyy')}
            </Paragraph>
          </Stack>
        )}
      </Stack>
    </Card>
  );
};

type FichesLieesProps = {
  fichesLiees: FicheWithRelations[];
};

const FichesLiees = ({ fichesLiees }: FichesLieesProps) => {
  if (fichesLiees.length === 0) return null;

  const firstFichesList = fichesLiees.slice(0, 2);
  const otherFichesList = fichesLiees.slice(2);

  return (
    <>
      <Divider className="mt-2" />
      <Stack gap={2.5}>
        <Stack wrap={false}>
          <Title variant="h5" className="text-primary-8 uppercase">
            Actions liées
          </Title>
          {firstFichesList.length > 0 && (
            <Stack gap={2.5} direction="row" className="flex-wrap">
              {firstFichesList.map((ficheLiee) => (
                <FicheLieeCard key={ficheLiee.id} ficheLiee={ficheLiee} />
              ))}
            </Stack>
          )}
        </Stack>
        {otherFichesList.length > 0 && (
          <Stack gap={2.5} direction="row" className="flex-wrap">
            {otherFichesList.map((ficheLiee) => (
              <FicheLieeCard key={ficheLiee.id} ficheLiee={ficheLiee} />
            ))}
          </Stack>
        )}
      </Stack>
    </>
  );
};

export default FichesLiees;
