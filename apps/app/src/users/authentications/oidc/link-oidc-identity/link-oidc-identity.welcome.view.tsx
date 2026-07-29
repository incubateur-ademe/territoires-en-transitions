'use client';

import { signInPath } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useSupabase, useTRPC } from '@tet/api';
import { Alert, Button, Field, Icon, Input } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { buildConfirmSessionUrl } from './link-oidc-identity.urls';
import { buildCreateUserUrl } from '../create-user-with-oidc/create-user-with-oidc.urls';

type BienvenueViewProps =
  | { ticket: string; next?: string; erreur?: undefined }
  | { erreur: 'email-non-verifie'; ticket?: undefined; next?: undefined };

type LocalView =
  | 'question'
  | 'reconnexion'
  | 'mot-de-passe-oublie'
  | 'mot-de-passe-oublie-envoye';

// `leading-snug` explicite : l'échelle `fontSize` du preset ne porte pas
// d'interligne, sans lui le `line-height` de 3rem de la règle globale `h1`
// s'appliquerait à ce texte de 1.25rem.
const titleClassName =
  'm-0 text-xl font-bold leading-snug text-balance text-primary-9';

/** Carte centrée type dialog qui enveloppe toutes les étapes du parcours. */
const Dialog = ({ children }: { children: React.ReactNode }) => (
  <div className="flex justify-center px-4 py-10">
    <div className="w-full max-w-lg rounded-xl border border-grey-3 bg-white p-6 shadow-lg md:p-8">
      {children}
    </div>
  </div>
);

/**
 * Écran de bienvenue ProConnect :
 * - cas 3 (aucune correspondance automatique) : demande si l'utilisateur a
 *   déjà un compte, puis oriente vers la création de compte, la reconnexion
 *   classique (pour rattacher l'ancien compte), ou le fallback « mot de passe
 *   oublié » ;
 * - cas 2 email non vérifié (`erreur='email-non-verifie'`) : un compte existe
 *   pour cette adresse mais le provider ne la déclare pas vérifiée ; on affiche
 *   une alerte plutôt que de rattacher automatiquement (sécurité).
 */
export const LinkOidcIdentityWelcomeView = (props: BienvenueViewProps) => {
  const [view, setView] = useState<LocalView>('question');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL as string;

  if (props.erreur === 'email-non-verifie') {
    return (
      <Dialog>
        <div
          className="flex flex-col gap-4"
          data-test="oidc.welcome.email-non-verifie"
        >
          <h1 className={titleClassName}>
            {appLabels.proconnectBienvenueEmailNonVerifieTitre}
          </h1>
          <Alert
            state="warning"
            description={appLabels.proconnectBienvenueEmailNonVerifie}
            footer={
              <Button href={signInPath} variant="secondary" size="sm">
                {appLabels.proconnectBienvenueRattachementRetourConnexion}
              </Button>
            }
          />
        </div>
      </Dialog>
    );
  }

  const { ticket, next } = props;

  const handleNon = () => {
    window.location.href = buildCreateUserUrl({ backendUrl, ticket, next });
  };

  return (
    <Dialog>
      {view === 'question' && (
        <div className="flex flex-col gap-4" data-test="oidc.welcome.question">
          <h1 className={cn(titleClassName, 'text-center')}>
            {appLabels.proconnectBienvenueQuestion}
          </h1>
          <p className="m-0 text-grey-8">
            {appLabels.proconnectBienvenueQuestionDescription}
          </p>
          <div className="mt-2 flex flex-col gap-3">
            <ChoixCard
              dataTest="oidc.welcome.oui"
              icon="link"
              titre={appLabels.proconnectBienvenueOui}
              detail={appLabels.proconnectBienvenueOuiDetail}
              onClick={() => setView('reconnexion')}
              recommande
            />
            <ChoixCard
              dataTest="oidc.welcome.non"
              icon="user-add-line"
              titre={appLabels.proconnectBienvenueNon}
              detail={appLabels.proconnectBienvenueNonDetail}
              onClick={handleNon}
            />
          </div>
        </div>
      )}

      {view === 'reconnexion' && (
        <ReconnexionForm
          ticket={ticket}
          next={next}
          onRetour={() => setView('question')}
          onMotDePasseOublie={() => setView('mot-de-passe-oublie')}
        />
      )}

      {view === 'mot-de-passe-oublie' && (
        <RattachementForm
          ticket={ticket}
          onSuccess={() => setView('mot-de-passe-oublie-envoye')}
          onCancel={() => setView('reconnexion')}
        />
      )}

      {view === 'mot-de-passe-oublie-envoye' && (
        <div data-test="oidc.welcome.invitation-succes">
          <Alert
            state="success"
            description={appLabels.proconnectBienvenueRattachementSucces}
            footer={
              <Button href={signInPath} variant="secondary" size="sm">
                {appLabels.proconnectBienvenueRattachementRetourConnexion}
              </Button>
            }
          />
        </div>
      )}
    </Dialog>
  );
};

/** Carte de choix (aiguillage « Oui / Non ») : icône + titre + détail + flèche. */
const ChoixCard = ({
  icon,
  titre,
  detail,
  onClick,
  dataTest,
  recommande,
}: {
  icon: string;
  titre: string;
  detail: string;
  onClick: () => void;
  dataTest: string;
  recommande?: boolean;
}) => (
  <button
    type="button"
    data-test={dataTest}
    onClick={onClick}
    className={cn(
      'flex items-center gap-4 rounded-lg border p-4 text-left transition-colors',
      recommande
        ? 'border-primary bg-primary-0 hover:bg-primary-1'
        : 'border-grey-4 hover:bg-grey-2'
    )}
  >
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
        recommande ? 'bg-primary-1 text-primary-9' : 'bg-grey-2 text-grey-8'
      )}
    >
      <Icon icon={icon} size="lg" />
    </span>
    <span className="flex-1">
      <span className="block font-bold text-primary-9">{titre}</span>
      <span className="block text-sm text-grey-8">{detail}</span>
    </span>
    <Icon
      icon="arrow-right-line"
      size="md"
      className="shrink-0 text-primary-9"
    />
  </button>
);

/** Une tuile du schéma de rattachement : icône encadrée + label dessous. */
const SchemaTuile = ({ icon, label }: { icon: string; label: string }) => (
  <span className="flex flex-col items-center gap-1.5">
    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-grey-3 bg-white text-primary-9">
      <Icon icon={icon} size="md" />
    </span>
    <span className="text-xs text-grey-8">{label}</span>
  </span>
);

const reconnexionSchema = z.object({
  email: z.email({ error: 'Un email valide est requis' }),
  password: z.string().min(8, {
    error: 'Le mot de passe doit comporter au moins 8 caractères',
  }),
});
type ReconnexionFormData = z.infer<typeof reconnexionSchema>;

type ReconnexionFormProps = {
  ticket: string;
  next?: string;
  onRetour: () => void;
  onMotDePasseOublie: () => void;
};

/**
 * Écran de reconnexion (cas « J'ai déjà un compte ») : l'utilisateur se
 * connecte une dernière fois avec les identifiants de son ancien compte. La
 * session Supabase posée, on navigue (navigation DURE, page publique) vers
 * `confirmer-session` qui relie l'identité OIDC portée par le ticket.
 */
const ReconnexionForm = ({
  ticket,
  next,
  onRetour,
  onMotDePasseOublie,
}: ReconnexionFormProps) => {
  const supabase = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isValid, errors },
  } = useForm<ReconnexionFormData>({
    resolver: zodResolver(reconnexionSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    setIsLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      { email, password }
    );
    if (signInError || !data.session) {
      setIsLoading(false);
      setError(appLabels.authErreurEmailOuMotDePasse);
      return;
    }
    // La session (cookies) est posée : navigation dure vers la page publique
    // `confirmer-session` (même origine que l'app courante) qui déclenche la
    // liaison au montage.
    window.location.assign(
      buildConfirmSessionUrl({ appUrl: window.location.origin, ticket, next })
    );
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      data-test="oidc.welcome.reconnexion"
    >
      <div>
        <Button
          type="button"
          variant="underlined"
          size="sm"
          icon="arrow-left-line"
          onClick={onRetour}
          dataTest="oidc.welcome.reconnexion.retour"
        >
          {appLabels.proconnectBienvenueRetour}
        </Button>
      </div>

      <h1 className={titleClassName}>
        {appLabels.proconnectBienvenueReconnexionTitre}
      </h1>
      <p className="m-0 text-grey-8">
        {appLabels.proconnectBienvenueReconnexionDescription}
      </p>

      <div className="flex items-center justify-center gap-3 rounded-lg bg-primary-0 px-4 py-4">
        <SchemaTuile
          icon="lock-line"
          label={appLabels.proconnectBienvenueReconnexionSchemaAncien}
        />
        <Icon icon="arrow-right-line" size="sm" className="text-primary-9" />
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-9 text-white">
          <Icon icon="link" size="md" />
        </span>
        <Icon icon="arrow-left-line" size="sm" className="text-primary-9" />
        <SchemaTuile
          icon="shield-user-line"
          label={appLabels.proconnectBienvenueReconnexionSchemaNouveau}
        />
      </div>

      <Field
        title={appLabels.champEmailAncienCompte}
        htmlFor="reconnexion-email"
        state={errors.email ? 'error' : undefined}
        message={errors.email?.message?.toString()}
      >
        <Input
          id="reconnexion-email"
          type="text"
          autoComplete="email"
          {...register('email')}
        />
      </Field>

      <Field
        title={appLabels.champMotDePasse}
        htmlFor="reconnexion-password"
        state={errors.password ? 'error' : undefined}
        message={errors.password?.message?.toString()}
      >
        <Input
          id="reconnexion-password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
      </Field>

      <div>
        <Button
          type="button"
          variant="underlined"
          size="sm"
          onClick={onMotDePasseOublie}
          dataTest="oidc.welcome.reconnexion.mot-de-passe-oublie"
        >
          {appLabels.proconnectBienvenueMotDePasseOublie}
        </Button>
      </div>

      {!!error && <Alert state="error" description={error} />}

      <Alert
        state="info"
        description={appLabels.proconnectBienvenueReconnexionInfo}
      />

      <Button
        type="submit"
        className="w-full justify-center"
        disabled={!isValid || isLoading}
        dataTest="oidc.welcome.reconnexion.valider"
      >
        {appLabels.proconnectBienvenueReconnexionBouton}
      </Button>
    </form>
  );
};

const rattachementSchema = z.object({
  initialMail: z.email({ error: 'Un email valide est requis' }),
});
type RattachementFormData = z.infer<typeof rattachementSchema>;

type RattachementFormProps = {
  ticket: string;
  onSuccess: () => void;
  onCancel: () => void;
};

/**
 * Formulaire de fallback « mot de passe oublié » : demande l'email de
 * l'ancien compte, déclenche l'envoi d'un email de rattachement.
 * Anti-énumération : le résultat est toujours le message générique de succès
 * — seule une erreur de ticket (expiré/invalide, distincte de l'énumération)
 * est affichée.
 */
const RattachementForm = ({
  ticket,
  onSuccess,
  onCancel,
}: RattachementFormProps) => {
  const trpc = useTRPC();
  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<RattachementFormData>({
    resolver: zodResolver(rattachementSchema),
    mode: 'onChange',
  });

  const { mutate, isPending, error } = useMutation(
    trpc.users.authentications.oidc.inviteUserToLinkIdentity.mutationOptions({
      meta: { disableToast: true },
    })
  );

  const onSubmit = handleSubmit(({ initialMail }) => {
    mutate({ ticket, initialMail }, { onSuccess });
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
      data-test="oidc.welcome.invitation-form"
    >
      <div>
        <Button
          type="button"
          variant="underlined"
          size="sm"
          icon="arrow-left-line"
          onClick={onCancel}
          dataTest="oidc.welcome.invitation-annuler"
        >
          {appLabels.proconnectBienvenueRetour}
        </Button>
      </div>

      <p className="m-0">{appLabels.proconnectBienvenueRattachementQuestion}</p>

      {!!error && (
        <Alert
          state="error"
          description={appLabels.proconnectBienvenueTicketInvalide}
        />
      )}

      <Field title={appLabels.champEmailAncienCompte} htmlFor="initialMail">
        <Input
          id="initialMail"
          type="text"
          autoComplete="email"
          {...register('initialMail')}
        />
      </Field>

      <Button
        type="submit"
        className="w-full justify-center"
        disabled={!isValid || isPending}
        dataTest="oidc.welcome.invitation-envoyer"
      >
        {appLabels.proconnectBienvenueRattachementEnvoyer}
      </Button>
    </form>
  );
};
