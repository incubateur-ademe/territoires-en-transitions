import { useFeatureFlagEnabled } from 'posthog-js/react';

/**
 * Feature flag key: 'is-generate-pptx-plan-report-enabled'
 *
 * This flag controls whether users see the button to generate a PowerPoint report for a plan.
 */
export function useGeneratePptxPlanReportEnabled() {
  return useFeatureFlagEnabled('is-generate-pptx-plan-report-enabled');
}
