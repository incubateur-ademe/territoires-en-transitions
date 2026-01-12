import { convertFileToBase64 } from '@/app/utils/convert-file-to-base64';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { GenerateReportFormArgs } from './generate-report.form';

export const useGenerateReport = (planId: number) => {
  const trpc = useTRPC();

  const { mutateAsync: createReport } = useMutation(
    trpc.plans.reports.create.mutationOptions({
      meta: {
        disableToast: true,
      },
    })
  );

  return useMutation({
    mutationKey: ['generate_plan_report_pptx', planId],
    mutationFn: async (args: GenerateReportFormArgs) => {
      // Convert File to base64 if provided
      const logoFileBase64 = args.logoFile
        ? await convertFileToBase64(args.logoFile)
        : undefined;

      // Prepare the request payload (excluding the File object)
      const { logoFile, ...requestPayload } = args;
      const payload = {
        ...requestPayload,
        ...(logoFileBase64 ? { logoFile: logoFileBase64 } : {}),
      };

      const result = await createReport(payload);
      return result;
    },
    meta: {
      disableToast: true,
    },
  });
};
