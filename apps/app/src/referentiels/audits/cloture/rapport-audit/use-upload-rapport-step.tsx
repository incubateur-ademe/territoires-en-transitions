import { JSX } from 'react';
import { RapportAuditUploadState } from '../data/use-upload-rapport-audit';
import { RapportAuditUploader } from './rapport.uploader';
import { UploadRapportStepFooter } from './upload-rapport-step-footer';

type UploadRapportStepArgs = {
  uploadState: RapportAuditUploadState;
  onNext: () => void;
  onCancel: () => void;
};

export const useUploadRapportStep = ({
  uploadState,
  onNext,
  onCancel,
}: UploadRapportStepArgs): { body: JSX.Element; footer: JSX.Element } => ({
  body: <RapportAuditUploader {...uploadState} />,
  footer: (
    <UploadRapportStepFooter
      onCancel={onCancel}
      onNext={onNext}
      canGoToNextStep={uploadState.canProceed}
    />
  ),
});
