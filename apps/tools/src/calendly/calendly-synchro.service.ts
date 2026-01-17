import { AirtableFeedbackRecord } from '../airtable/airtable-feedback.record';
import { AirtableProspectRecord } from '../airtable/airtable-prospect.record';
import {
  AirtableRowInsertDto,
  AirtableUpdateRowDto,
} from '../airtable/airtable-row-insert.dto';
import { AirtableRowDto } from '../airtable/airtable-row.dto';
import { AirtableUserRecord } from '../airtable/airtable-user.record';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { format } from 'date-fns';
import { keyBy, partition, uniq } from 'es-toolkit';
import { AirtableService } from '../airtable/airtable.service';
import ConfigurationService from '../config/configuration.service';
import { TrpcClientService } from '../utils/trpc/trpc-client.service';
import { CalendlyApiService } from './calendly-api.service';
import { DemoSessionBySlug, demoSessionSchema } from './demo-sessions';

/**
 * Synchronise les inscrits aux sessions de démo entre Calendly et Airtable
 */
@Injectable()
export class CalendlySynchroService {
  private readonly logger = new Logger(CalendlySynchroService.name);
  private readonly trpcClient = this.trpcClientService.getClient();
  private readonly dbId = this.configurationService.get(
    'AIRTABLE_CRM_DATABASE_ID'
  );
  private readonly feedbackTableId = this.configurationService.get(
    'AIRTABLE_CRM_FEEDBACKS_TABLE_ID'
  );
  private readonly userTableId = this.configurationService.get(
    'AIRTABLE_CRM_USERS_TABLE_ID'
  );
  private readonly prospectTableId = this.configurationService.get(
    'AIRTABLE_CRM_PROSPECTS_TABLE_ID'
  );
  private readonly decouverteSessionFieldName =
    'Comment avez-vous découvert cette session ?';
  // permet de vérifier les entrées valides pour ne pas créer de doublon
  private readonly validDecouverteSessionOptions = [
    "Via l'ADEME (programme T.E.T.E / COT)",
    "Suite à un appel de l'équipe Territoires en Transitions",
    "Suite à un mail de l'équipe Territoires en Transitions",
    'Via mes collègues qui l’utilisent (interne)',
    'Via une autre collectivité, mon réseau ou partenaires (externe)',
    'Via les réseaux sociaux, ou un évènement',
    'Via une recherche internet',
    'Autres',
  ];

  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly trpcClientService: TrpcClientService,
    private readonly calendlyService: CalendlyApiService,
    private readonly airtableService: AirtableService
  ) {}

  /** Point d'entrée principal (à appeler à partir d'un cron) */
  async process() {
    const sessions = await this.calendlyService.getNextSessionsAndInvitees();

    let userByEmail: Record<string, AirtableRowDto<AirtableUserRecord>> = {};
    let prospectByEmail: Record<
      string,
      AirtableRowDto<AirtableProspectRecord>
    > = {};
    const usersToAdd: Array<Partial<AirtableUserRecord>> = [];
    const usersToUpdate: Array<
      AirtableUpdateRowDto<Partial<AirtableUserRecord>>
    > = [];
    const prospectsToAdd: Array<Partial<AirtableProspectRecord>> = [];
    const prospectsToUpdate: Array<
      AirtableUpdateRowDto<Partial<AirtableProspectRecord>>
    > = [];

    // conserve que les inscrits qui n'ont pas annulé
    const allInvitees = sessions?.flatMap((session) => session.invitees) || [];
    const activeInvitees = allInvitees.filter(
      (invitee) => invitee?.status === 'active'
    );
    const activeInviteesByEmail = keyBy(
      activeInvitees,
      (invitee) => invitee?.email || ''
    );

    // charge et indexe les données existantes des inscrits
    const allEmails = uniq(
      activeInvitees.map((invitee) => invitee?.email)
    ) as string[];
    if (allEmails?.length) {
      const users = await this.airtableService.getUsersByEmail(allEmails);
      if (users?.length) {
        this.logger.log(
          `Calendly sync: ${users.length} utilisateurs existants`
        );
        userByEmail = keyBy(users, (u) => u.fields.email);
      }

      const prospects = await this.airtableService.getProspectsByEmail(
        allEmails
      );
      if (prospects?.length) {
        this.logger.log(
          `Calendly sync: ${prospects.length} prospects existants`
        );
        prospectByEmail = keyBy(prospects, (p) => p.fields.Email);
      }

      // extrait la liste des contacts qui ne sont pas encore dans le CRM
      const [newContacts, existingContacts] = partition(
        allEmails,
        (email) => !userByEmail[email] && !prospectByEmail[email]
      );
      if (newContacts.length) {
        // vérifie si ils sont déjà dans la plateforme
        const existingUsers =
          await this.trpcClient.users.users.listByEmails.query({
            emails: newContacts,
          });
        const existingUsersByEmail = keyBy(existingUsers, (u) => u.email);

        newContacts.forEach((newContact) => {
          const invitee = activeInviteesByEmail[newContact];
          if (!invitee) {
            return;
          }
          const decouverteSession = this.parseDecouverteSessionOptions(
            invitee.decouverteSession
          );

          if (existingUsersByEmail[newContact]) {
            const { email, nom, prenom, id, telephone } = existingUsersByEmail[
              newContact
            ] as {
              email: string;
              nom: string;
              prenom: string;
              id: string;
              telephone: string;
            };
            usersToAdd.push({
              user_id: id,
              prenom,
              nom,
              telephone: telephone || undefined,
              email,
              [this.decouverteSessionFieldName]: decouverteSession,
            });
          } else if (activeInviteesByEmail[newContact]) {
            prospectsToAdd.push({
              Prénom: invitee.firstName || undefined,
              Nom: invitee.lastName || undefined,
              Email: invitee.email,
              Téléphone: invitee.telephone,
              'Fonction (intitulé)': invitee.fonction,
              'Collectivités hors PF': invitee.collectivite,
              [this.decouverteSessionFieldName]: decouverteSession,
              'Raisons inscriptions': invitee.raisonsInscription
                ? invitee.raisonsInscription.split('\n')
                : undefined,
            });
          }
        });
      }

      // prépare la liste des utilisateurs/prospects à mettre à jour
      if (existingContacts.length) {
        existingContacts.forEach((existingContact) => {
          const invitee = activeInviteesByEmail[existingContact];
          if (!invitee?.decouverteSession) {
            return;
          }
          const decouverteSession = this.parseDecouverteSessionOptions(
            invitee.decouverteSession
          );
          if (!decouverteSession) {
            return;
          }

          const user = userByEmail[existingContact];
          if (user) {
            if (!user.fields[this.decouverteSessionFieldName]) {
              usersToUpdate.push({
                id: user.id,
                fields: {
                  [this.decouverteSessionFieldName]: decouverteSession,
                },
              });
            }
          } else {
            const prospect = prospectByEmail[existingContact];
            if (prospect) {
              prospectsToUpdate.push({
                id: prospect.id,
                fields: {
                  [this.decouverteSessionFieldName]: decouverteSession,
                },
              });
            }
          }
        });
      }
    }

    // ajoute les utilisateurs manquants
    if (usersToAdd.length) {
      this.logger.log(
        `Calendly sync: ajoute ${usersToAdd.length} utilisateurs`
      );
      const response = await this.airtableService.insertRecords(
        this.dbId,
        this.userTableId,
        usersToAdd.map((fields) => ({ fields }))
      );
      response?.forEach((user) => {
        if (user.fields.email !== undefined) {
          userByEmail[user.fields.email] =
            user as AirtableRowDto<AirtableUserRecord>;
        }
      });
    }

    // met à jour les utilisateurs existants
    const optionsToUpdateDecouverteSession = {
      fieldsToMergeOn: [], // ne permet pas l'upsert (juste l'update)
    };
    if (usersToUpdate.length) {
      this.logger.log(
        `Calendly sync: met à jour ${usersToUpdate.length} utilisateurs`
      );
      await this.airtableService.insertRecords(
        this.dbId,
        this.userTableId,
        usersToUpdate,
        optionsToUpdateDecouverteSession
      );
    }

    // ajoute les prospects manquants
    if (prospectsToAdd.length) {
      this.logger.log(
        `Calendly sync: ajoute ${prospectsToAdd.length} prospects`
      );
      const response = await this.airtableService.insertRecords(
        this.dbId,
        this.prospectTableId,
        prospectsToAdd.map((fields) => ({ fields }))
      );
      response?.forEach((user) => {
        if (user.fields.Email !== undefined) {
          prospectByEmail[user.fields.Email] =
            user as AirtableRowDto<AirtableProspectRecord>;
        }
      });
    }

    // met à jour les prospects existants
    if (prospectsToUpdate.length) {
      this.logger.log(
        `Calendly sync: met à jour ${prospectsToUpdate.length} prospects`
      );
      await this.airtableService.insertRecords(
        this.dbId,
        this.userTableId,
        prospectsToUpdate,
        optionsToUpdateDecouverteSession
      );
    }

    // traite chaque session qui va démarrer
    if (sessions?.length) {
      const sessionsToAdd = await Promise.all(
        sessions.map(async ({ eventType, session, invitees }) => {
          if (!session.startTime) {
            throw new InternalServerErrorException(
              `Calendly sync: startTime non valide pour l'événement type ${eventType.slug}`
            );
          }

          const demoSession = DemoSessionBySlug[eventType.slug];
          if (
            !demoSession ||
            !demoSessionSchema.safeParse(demoSession).success
          ) {
            throw new InternalServerErrorException(
              `Calendly sync: définition de la session "${JSON.stringify(
                demoSession
              )}" non valide pour l'événement type ${eventType.slug}`
            );
          }

          // extrait la valeur voulue pour les colonnes "Source" et "Origine de
          // l'échange" et formate la date de la session
          const { source, origin } = demoSession;
          const startDate = format(new Date(session.startTime), 'yyyy-MM-dd');
          const sourceURL = session.uri;

          // cherche si il existe déjà une ligne dans le tableau Feedback pour
          // l'URL de la session
          const records =
            await this.airtableService.getRecords<AirtableFeedbackRecord>(
              this.dbId,
              this.feedbackTableId,
              {
                filterByFormula: `SourceUrl="${sourceURL}"`,
              }
            );
          const feedbackRecord = records?.records?.[0];

          this.logger.log(
            `Calendly sync: Entrée pour la session ${sourceURL} (${source} le ${startDate}) ${
              feedbackRecord ? 'trouvée' : 'non trouvée'
            }`
          );

          // construit la liste des ID de personnes à partir de la liste des invités
          const sessionInvitees =
            invitees?.filter((invitee) => invitee.status === 'active') || [];
          const personnes = uniq(
            sessionInvitees
              .map((invitee) => userByEmail[invitee.email]?.id || null)
              .filter(Boolean) as string[]
          );
          const personnesHorsPF = uniq(
            sessionInvitees
              .map((invitee) => prospectByEmail[invitee.email]?.id || null)
              .filter(Boolean) as string[]
          );

          this.logger.log(
            `Calendly sync: ${
              sessionInvitees?.length || 0
            } inscrits n'ayant pas annulé, dont ${
              personnes.length
            } utilisateurs et ${personnesHorsPF.length} prospects`
          );

          // renvoie le nouvel enregistrement à upsert dans airtable
          return {
            id: feedbackRecord?.id,
            fields: {
              Date: format(new Date(session.startTime), 'MM/dd/yyyy'),
              Source: [source],
              SourceUrl: sourceURL,
              "Origine de l'échange": origin,
              Personnes: personnes,
              'Personnes hors PF': personnesHorsPF,
            },
          } as AirtableRowInsertDto<Partial<AirtableFeedbackRecord>>;
        })
      );

      // insère/update les enregistrements
      this.logger.log(`Calendly sync: upsert ${sessionsToAdd.length} sessions`);
      const response = await this.airtableService.insertRecords(
        this.dbId,
        this.feedbackTableId,
        sessionsToAdd,
        { fieldsToMergeOn: ['Source', 'Date'] }
      );
      this.logger.log(
        `Calendly sync: ${response.length} sessions insérées/màj`
      );
    }
  }

  // normalise et filtre les options de la liste "Comment avez-vous découvert cette session"
  parseDecouverteSessionOptions(optionsValue: string | undefined) {
    const options = optionsValue
      ?.split('\n')
      .map((option) => option.trim().replaceAll('’', "'"))
      .filter((option) => !!option)
      .map((option) =>
        this.validDecouverteSessionOptions.includes(option) ? option : 'Autres'
      );

    return options?.length ? options : undefined;
  }
}
