import { AirtableFeedbackRecord } from '@/tools/airtable/airtable-feedback.record';
import { AirtableProspectRecord } from '@/tools/airtable/airtable-prospect.record';
import { AirtableRowInsertDto } from '@/tools/airtable/airtable-row-insert.dto';
import { AirtableRowDto } from '@/tools/airtable/airtable-row.dto';
import { AirtableUserRecord } from '@/tools/airtable/airtable-user.record';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { format } from 'date-fns';
import { keyBy, uniq } from 'es-toolkit';
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
    const prospectsToAdd: Array<Partial<AirtableProspectRecord>> = [];

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
      const newContacts = allEmails.filter(
        (email) => !userByEmail[email] && !prospectByEmail[email]
      );
      if (newContacts.length) {
        // vérifie si ils sont déjà dans la plateforme
        const existingUsers = await this.trpcClient.users.getAll.query({
          emails: newContacts,
        });
        const existingUsersByEmail = keyBy(existingUsers, (u) => u.email);

        newContacts.forEach((newContact) => {
          const invitee = activeInviteesByEmail[newContact];
          if (!invitee) {
            return;
          }

          if (existingUsersByEmail[newContact]) {
            const { email, nom, prenom, userId, telephone } =
              existingUsersByEmail[newContact];
            usersToAdd.push({
              user_id: userId,
              prenom,
              nom,
              telephone: telephone || undefined,
              email,
            });
          } else if (activeInviteesByEmail[newContact]) {
            prospectsToAdd.push({
              Prénom: invitee.firstName || undefined,
              Nom: invitee.lastName || undefined,
              Email: invitee.email,
              Téléphone: invitee.telephone,
              'Fonction (intitulé)': invitee.fonction,
              'Collectivités hors PF': invitee.collectivite,
              'Découverte PF': invitee.decouvertePF,
              'Raisons inscriptions': invitee.raisonsInscription
                ? invitee.raisonsInscription.split('\n')
                : undefined,
            });
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
}
