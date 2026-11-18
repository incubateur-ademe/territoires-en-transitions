import { appLabels } from '@/app/labels/catalog';
import {
  AiPlanImportProfileEnum,
  type AiPlanImportProfile,
} from '@tet/domain/plans';
import { Alert } from '@tet/ui';
import { RequestPlanImportInfo } from './request-plan-import.info';

export const AiImportAvailabilityAlert = ({
  profiles,
  profile,
  selectedPlanTypeId,
  isLoading,
  isProfileAvailable,
}: {
  profiles: readonly AiPlanImportProfile[];
  profile: AiPlanImportProfile;
  selectedPlanTypeId: number | null;
  isLoading: boolean;
  isProfileAvailable: boolean;
}) => {
  if (isLoading || isProfileAvailable) return null;

  return (
    <Alert
      state="info"
      description={
        <>
          <p className="mb-0">
            {profiles.length === 0
              ? appLabels.importPlanIaIndisponible
              : profile === AiPlanImportProfileEnum.GENERIC
              ? appLabels.importPlanIaTypesAutorises(profiles)
              : appLabels.importPlanIaProfilIndisponible}
          </p>
          {selectedPlanTypeId !== null || profiles.length === 0 ? (
            <RequestPlanImportInfo />
          ) : null}
        </>
      }
    />
  );
};
