'use client';

import { useSuperAdminMode } from '@/app/users/authorizations/super-admin-mode/super-admin-mode.provider';
import {
  installSafeLinksHook,
  isBannerType,
  SAFE_HTML_CONFIG,
  UpsertBannerInput,
  type BannerType,
} from '@tet/domain/utils';
import {
  Alert,
  Button,
  Checkbox,
  Field,
  RichTextEditor,
  Select,
} from '@tet/ui';
import DOMPurify from 'dompurify';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BannerInfoBox } from './banner-info.box';
import { isUrgentBannerType } from './banner-info.utils';
import { useGetBannerInfo } from './use-get-banner-info';
import { useUpsertBannerInfo } from './use-upsert-banner-info';

// Install the rel="noopener noreferrer" hook on the browser DOMPurify
// instance once at module load (mirrors the server-side install in
// banner.service.ts; helper lives in @tet/domain/utils).
installSafeLinksHook(DOMPurify);

const TYPE_OPTIONS = [
  { value: 'info', label: 'Information' },
  { value: 'warning', label: 'Avertissement' },
  { value: 'error', label: 'Erreur' },
  { value: 'event', label: 'Événement' },
] as const satisfies readonly { value: BannerType; label: string }[];

const DEFAULT_VALUES: UpsertBannerInput = {
  type: 'info',
  info: '',
  active: false,
};

export const BannerInfoPage = () => {
  const { isSuperAdminRoleEnabled } = useSuperAdminMode();

  const { data, isLoading, isError } = useGetBannerInfo();
  const { mutate: upsertBanner, isPending } = useUpsertBannerInfo();

  const { control, handleSubmit, reset, setValue, watch } =
    useForm<UpsertBannerInput>({ defaultValues: DEFAULT_VALUES });

  // Sync the form to the latest server state when data arrives or the
  // server-side modifiedAt changes (post-save invalidation). The hook
  // disables refetchOnWindowFocus, so this won't fire mid-edit.
  useEffect(() => {
    if (data) {
      reset({ type: data.type, info: data.info, active: data.active });
    }
  }, [data, reset]);

  const watchedType = watch('type');
  const watchedInfo = watch('info');
  const watchedActive = watch('active');

  if (!isSuperAdminRoleEnabled) {
    return null;
  }

  if (isError) {
    return (
      <div className="max-w-3xl">
        <h2 className="mb-6">Bannière</h2>
        <Alert
          state="error"
          title="Erreur de chargement de la bannière. Réessayez ou rechargez la page."
        />
      </div>
    );
  }

  const isLoaded = !isLoading && data !== undefined;
  const hasContent = watchedInfo.trim().length > 0;

  const onSubmit = (values: UpsertBannerInput) => {
    upsertBanner(values);
  };

  const previewHtml = hasContent
    ? DOMPurify.sanitize(watchedInfo, SAFE_HTML_CONFIG)
    : '';
  const previewUrgent = isUrgentBannerType(watchedType);

  const lastModificationLine = data
    ? `Dernière modification le ${new Date(data.modifiedAt).toLocaleString(
        'fr-FR'
      )} par ${data.modifiedByNom}`
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
      <h2 className="mb-6">Bannière</h2>

      <div className="space-y-6 border border-grey-3 rounded-lg p-6 bg-white">
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Field title="Type">
              <Select
                options={[...TYPE_OPTIONS]}
                values={field.value}
                onChange={(value) => {
                  if (isBannerType(value)) {
                    field.onChange(value);
                  }
                }}
                disabled={!isLoaded || isPending}
              />
            </Field>
          )}
        />

        <Field title="Contenu">
          {isLoaded ? (
            <RichTextEditor
              key={isLoaded ? 'hydrated' : 'empty'}
              dataTest="banner-info-editor"
              ariaLabel="Contenu de la bannière"
              initialValue={data?.info ?? ''}
              onChange={(html) => setValue('info', html)}
              disabled={isPending}
            />
          ) : (
            <RichTextEditor isLoading initialValue="" />
          )}
        </Field>

        <Controller
          name="active"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Bannière active"
              checked={field.value}
              onChange={(e) => field.onChange(e.currentTarget.checked)}
              disabled={!isLoaded || isPending}
            />
          )}
        />

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={
              !isLoaded || (watchedActive && !hasContent) || isPending
            }
          >
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {lastModificationLine && (
        <p className="mt-3 text-xs text-grey-7">{lastModificationLine}</p>
      )}

      {hasContent && (
        <div className="mt-8">
          <h3 className="mb-3 text-base">Aperçu</h3>
          <div
            role={previewUrgent ? 'alert' : 'status'}
            aria-live={previewUrgent ? 'assertive' : 'polite'}
          >
            <BannerInfoBox type={watchedType} html={previewHtml} />
          </div>
        </div>
      )}
    </form>
  );
};
