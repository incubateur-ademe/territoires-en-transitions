import { CsvService } from '@tet/backend/utils/csv/csv.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { buildRequesterUser } from '@tet/backend/users/models/auth.models';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { CollectiviteRole } from '@tet/domain/users';
import { getErrorMessage } from '@tet/domain/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { invitationTable } from '../invitation.table';
import { InvitationService } from '../mutate-invitations/invitation.service';
import {
  CORRESPONDANT_CSV_PARSE_OPTIONS,
  correspondantCsvSchema,
  LigneCsvBrute,
} from './correspondant-csv.schema';
import {
  ImportCorrespondantsError,
  ImportCorrespondantsErrorEnum,
} from './import-correspondants.errors';
import {
  ImportCorrespondantsInput,
  MAX_ENVOIS_PAR_PASSAGE,
} from './import-correspondants.input';
import {
  ImportCorrespondantsOutput,
  ResultatCorrespondant,
  StatutCorrespondant,
  statutCorrespondantValues,
} from './import-correspondants.output';
import {
  ResolveServiceRepository,
  ServiceResolu,
} from './resolve-service.repository';
import { extraireCleAppariement } from './resolve-service.rules';
import { SendInvitationCorrespondantService } from './send-invitation-correspondant.service';

type Ignoree = {
  kind: 'ignorer';
  ligne: number;
  email: string;
  service: ServiceResolu | null;
  statut: StatutCorrespondant;
  motif?: string;
};

type AEcrire = {
  kind: 'ecrire';
  ligne: number;
  email: string;
  service: ServiceResolu;
  role: CollectiviteRole;
  /** Un compte existe : on posera un droit plutôt qu'une invitation. */
  avecCompte: boolean;
  motif?: string;
};

type Decision = Ignoree | AEcrire;

/**
 * Rattache les correspondants d'un fichier à leur service et leur écrit une fois.
 *
 * Deux phases : la décision ne lit rien d'autre que la base, l'exécution
 * n'intervient qu'en mode envoi. Le mode à blanc est donc fidèle par
 * construction — il joue la phase 1 et rend ce que la phase 2 ferait.
 */
@Injectable()
export class ImportCorrespondantsService {
  private readonly logger = new Logger(ImportCorrespondantsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly csvService: CsvService,
    private readonly resolveServiceRepository: ResolveServiceRepository,
    private readonly invitationService: InvitationService,
    private readonly sendInvitationCorrespondantService: SendInvitationCorrespondantService
  ) {}

  async importer(
    input: ImportCorrespondantsInput
  ): Promise<Result<ImportCorrespondantsOutput, ImportCorrespondantsError>> {
    const initiateurId = await this.resoudreInitiateur(input.initiateurEmail);
    if (!initiateurId) {
      return failure(ImportCorrespondantsErrorEnum.INITIATEUR_INCONNU);
    }

    const lignes = await this.lireCsv(input.contenuCsv);
    if (!lignes.success) {
      return lignes;
    }

    const decisions = await this.decider(lignes.data);
    const aEnvoyer = decisions.filter(
      (decision): decision is AEcrire => decision.kind === 'ecrire'
    );

    // Le plafond protège l'écriture : un passage à blanc doit pouvoir rendre
    // son rapport, fût-il celui d'un fichier qui a dérapé.
    if (input.mode === 'envoi' && aEnvoyer.length > MAX_ENVOIS_PAR_PASSAGE) {
      return failure(ImportCorrespondantsErrorEnum.TROP_D_ENVOIS);
    }

    const resultats: ResultatCorrespondant[] =
      input.mode === 'envoi'
        ? await this.executer(decisions, initiateurId)
        : decisions.map((decision) => this.enResultat(decision));

    return success({
      mode: input.mode,
      lignesLues: lignes.data.length,
      envoisPrevus: aEnvoyer.length,
      resultats,
      totaux: this.compter(resultats),
    });
  }

  private async resoudreInitiateur(email: string): Promise<string | null> {
    const [initiateur] = await this.databaseService.db
      .select({ id: dcpTable.id })
      .from(dcpTable)
      .where(eq(sql`lower(${dcpTable.email})`, email.toLowerCase()))
      .limit(1);

    return initiateur?.id ?? null;
  }

  private async lireCsv(
    contenu: string
  ): Promise<Result<LigneCsvBrute[], ImportCorrespondantsError>> {
    try {
      const { data } = await this.csvService.getDataFromCsvContent<LigneCsvBrute>(
        contenu,
        { parseOptions: { ...CORRESPONDANT_CSV_PARSE_OPTIONS } }
      );
      return success(data);
    } catch (error) {
      this.logger.error(`CSV illisible : ${getErrorMessage(error)}`);
      return failure(ImportCorrespondantsErrorEnum.CSV_ILLISIBLE);
    }
  }

  /**
   * Phase 1 : le sort de chaque ligne, sans rien écrire.
   *
   * Ce que la base porte déjà fait foi : un droit actif ou une invitation
   * pendante disent qu'il n'y a rien à refaire. C'est ce qui garantit qu'un
   * second passage du même fichier n'écrit à personne deux fois.
   */
  private async decider(lignes: LigneCsvBrute[]): Promise<Decision[]> {
    const analysees = await this.resoudreServices(lignes);
    const aResoudre = analysees.filter((ligne) => ligne.service !== null);

    const comptes = await this.lireComptes(
      aResoudre.map(({ email }) => email as string)
    );

    const couples = aResoudre.map(({ email, service }) => ({
      email: email as string,
      collectiviteId: (service as ServiceResolu).collectiviteId,
    }));
    const [droits, invitations] = await Promise.all([
      this.lireDroits(couples, comptes),
      this.lireInvitations(couples),
    ]);

    const cle = (collectiviteId: number, email: string) =>
      `${collectiviteId}::${email}`;

    // Tout est décidé avant la première écriture : la base ne peut pas
    // départager deux lignes d'un même passage, le doublon se voit donc ici.
    const dejaVus = new Map<string, number>();

    return analysees.map((analysee): Decision => {
      if (!analysee.service || !analysee.email) {
        return {
          kind: 'ignorer',
          ligne: analysee.ligne,
          email: analysee.email ?? '',
          service: analysee.service,
          statut: 'erreur',
          motif: analysee.motif,
        };
      }

      const { ligne, email, service } = analysee;
      const base = { ligne, email, service };

      const coupleCle = cle(service.collectiviteId, email);
      const premiereLigne = dejaVus.get(coupleCle);
      if (premiereLigne !== undefined) {
        return {
          ...base,
          kind: 'ignorer',
          statut: 'erreur',
          motif: `doublon de la ligne ${premiereLigne}`,
        };
      }
      dejaVus.set(coupleCle, ligne);

      const compte = comptes.get(email) ?? null;
      const droitActif = compte
        ? droits.has(cle(service.collectiviteId, compte))
        : false;
      const invitation = invitations.get(cle(service.collectiviteId, email));

      if (droitActif) {
        return { ...base, kind: 'ignorer', statut: 'deja_membre' };
      }
      if (invitation && invitation.active === false && !invitation.pending) {
        return { ...base, kind: 'ignorer', statut: 'revoquee' };
      }
      if (invitation?.pending) {
        return { ...base, kind: 'ignorer', statut: 'deja_invite' };
      }

      return {
        ...base,
        kind: 'ecrire',
        role: analysee.role,
        avecCompte: compte !== null,
        motif: analysee.motif,
      };
    });
  }

  /** Phase 2 : ligne par ligne, isolément — une erreur n'emporte pas les autres. */
  private async executer(
    decisions: Decision[],
    initiateurId: string
  ): Promise<ResultatCorrespondant[]> {
    const resultats: ResultatCorrespondant[] = [];

    for (const decision of decisions) {
      if (decision.kind === 'ignorer') {
        resultats.push(this.enResultat(decision));
        continue;
      }

      resultats.push(await this.executerLigne(decision, initiateurId));
    }

    return resultats;
  }

  private async executerLigne(
    decision: AEcrire,
    initiateurId: string
  ): Promise<ResultatCorrespondant> {
    const { email, service } = decision;

    try {
      // `createInvitation` fait les deux cas : elle pose le droit et rend `null`
      // quand un compte existe, sinon elle crée le lien et rend son identifiant.
      const invitationId = await this.invitationService.createInvitation(
        {
          collectiviteId: service.collectiviteId,
          email,
          role: decision.role,
        },
        buildRequesterUser(initiateurId)
      );

      const envoi = await this.sendInvitationCorrespondantService.send({
        to: email,
        service,
        role: decision.role,
        cible: invitationId
          ? { urlType: 'invitation', invitationId }
          : { urlType: 'rattachement' },
      });

      if (!envoi.success) {
        // Le rattachement tient, seul le message a manqué. Un administrateur
        // peut renvoyer l'invitation depuis la page des membres du service.
        return {
          ...this.enResultat(decision),
          statut: 'echec_envoi',
          motif: envoi.error,
        };
      }

      return {
        ...this.enResultat(decision),
        statut: invitationId ? 'invite' : 'rattache',
      };
    } catch (error) {
      // La ligne sort en erreur, les suivantes sont traitées quand même et le
      // rapport arrive à l'opérateur.
      this.logger.error(
        `Import impossible sur le service ${service.collectiviteId} : ${getErrorMessage(
          error
        )}`
      );
      return {
        ...this.enResultat(decision),
        statut: 'erreur',
        motif: getErrorMessage(error),
      };
    }
  }

  private enResultat(decision: Decision): ResultatCorrespondant {
    return {
      ligne: decision.ligne,
      email: decision.email,
      service: decision.service
        ? {
            collectiviteId: decision.service.collectiviteId,
            nom: decision.service.nom,
            type: decision.service.type,
          }
        : null,
      statut:
        decision.kind === 'ignorer'
          ? decision.statut
          : decision.avecCompte
          ? 'rattache'
          : 'invite',
      ...(decision.motif ? { motif: decision.motif } : {}),
    };
  }

  private compter(
    resultats: ResultatCorrespondant[]
  ): Record<StatutCorrespondant, number> {
    const totaux = Object.fromEntries(
      statutCorrespondantValues.map((statut) => [statut, 0])
    ) as Record<StatutCorrespondant, number>;

    for (const resultat of resultats) {
      totaux[resultat.statut] += 1;
    }
    return totaux;
  }

  /**
   * Valide chaque ligne et lui trouve son service, en mémoïsant : un fichier
   * porte plusieurs correspondants pour un même service.
   */
  private async resoudreServices(lignes: LigneCsvBrute[]): Promise<
    {
      ligne: number;
      email: string | null;
      role: CollectiviteRole;
      service: ServiceResolu | null;
      motif?: string;
    }[]
  > {
    const cache = new Map<string, ServiceResolu | null>();
    const analysees = [];

    for (const brute of lignes) {
      const ligne = brute.info.lines;
      const parsee = correspondantCsvSchema.safeParse(brute.record);
      if (!parsee.success) {
        analysees.push({
          ligne,
          email: brute.record?.email?.trim().toLowerCase() ?? null,
          role: CollectiviteRole.ADMIN,
          service: null,
          motif: parsee.error.issues.map((issue) => issue.message).join(' ; '),
        });
        continue;
      }

      const correspondant = parsee.data;
      const role = correspondant.role ?? CollectiviteRole.ADMIN;
      const cle = extraireCleAppariement(correspondant);
      if (!cle.success) {
        analysees.push({
          ligne,
          email: correspondant.email,
          role,
          service: null,
          motif: cle.error,
        });
        continue;
      }

      const memo = `${correspondant.type}::${cle.data.colonne}::${cle.data.valeur}`;
      if (!cache.has(memo)) {
        const resolu = await this.resolveServiceRepository.resoudre(
          correspondant.type as Parameters<
            ResolveServiceRepository['resoudre']
          >[0],
          cle.data
        );
        cache.set(memo, resolu.success ? resolu.data : null);
        if (!resolu.success) {
          this.logger.warn(
            `${resolu.error} : ${correspondant.type} ${cle.data.colonne}=${cle.data.valeur}`
          );
        }
      }

      const service = cache.get(memo) ?? null;
      if (!service) {
        analysees.push({
          ligne,
          email: correspondant.email,
          role,
          service: null,
          motif: `aucun service ${correspondant.type} pour ${cle.data.colonne}=${cle.data.valeur}, ou plusieurs`,
        });
        continue;
      }

      // Le nom du fichier ne sert qu'au contrôle : un écart se signale, il
      // n'invalide pas l'appariement.
      const motif =
        correspondant.nom && service.nom && correspondant.nom !== service.nom
          ? `le fichier annonce « ${correspondant.nom} », la base porte « ${service.nom} »`
          : undefined;

      analysees.push({ ligne, email: correspondant.email, role, service, motif });
    }

    return analysees;
  }

  /** Les comptes existants, par adresse normalisée. */
  private async lireComptes(emails: string[]): Promise<Map<string, string>> {
    if (!emails.length) {
      return new Map();
    }

    const comptes = await this.databaseService.db
      .select({ id: dcpTable.id, email: sql<string>`lower(${dcpTable.email})` })
      .from(dcpTable)
      .where(inArray(sql`lower(${dcpTable.email})`, emails));

    return new Map(comptes.map((compte) => [compte.email, compte.id]));
  }

  /** Les couples (service, compte) déjà titulaires d'un droit actif. */
  private async lireDroits(
    couples: { collectiviteId: number; email: string }[],
    comptes: Map<string, string>
  ): Promise<Set<string>> {
    const avecCompte = couples
      .map(({ collectiviteId, email }) => ({
        collectiviteId,
        userId: comptes.get(email),
      }))
      .filter(
        (couple): couple is { collectiviteId: number; userId: string } =>
          couple.userId !== undefined
      );

    if (!avecCompte.length) {
      return new Set();
    }

    const droits = await this.databaseService.db
      .select({
        collectiviteId: utilisateurCollectiviteAccessTable.collectiviteId,
        userId: utilisateurCollectiviteAccessTable.userId,
      })
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.isActive, true),
          or(
            ...avecCompte.map((couple) =>
              and(
                eq(
                  utilisateurCollectiviteAccessTable.collectiviteId,
                  couple.collectiviteId
                ),
                eq(utilisateurCollectiviteAccessTable.userId, couple.userId)
              )
            )
          )
        )
      );

    return new Set(
      droits.map((droit) => `${droit.collectiviteId}::${droit.userId}`)
    );
  }

  /** Les invitations existantes, pendantes ou révoquées, par (service, adresse). */
  private async lireInvitations(
    couples: { collectiviteId: number; email: string }[]
  ): Promise<
    Map<string, { id: string; pending: boolean | null; active: boolean | null }>
  > {
    if (!couples.length) {
      return new Map();
    }

    const invitations = await this.databaseService.db
      .select({
        id: invitationTable.id,
        collectiviteId: invitationTable.collectiviteId,
        email: sql<string>`lower(${invitationTable.email})`,
        pending: invitationTable.pending,
        active: invitationTable.active,
      })
      .from(invitationTable)
      .where(
        or(
          ...couples.map((couple) =>
            and(
              eq(invitationTable.collectiviteId, couple.collectiviteId),
              eq(sql`lower(${invitationTable.email})`, couple.email)
            )
          )
        )
      );

    const parCle = new Map<
      string,
      { id: string; pending: boolean | null; active: boolean | null }
    >();
    for (const invitation of invitations) {
      const cle = `${invitation.collectiviteId}::${invitation.email}`;
      // Une adresse peut avoir été invitée puis révoquée puis réinvitée : la
      // pendante prime, sinon la dernière connue suffit à dire « révoquée ».
      if (!parCle.has(cle) || invitation.pending) {
        parCle.set(cle, {
          id: invitation.id,
          pending: invitation.pending,
          active: invitation.active,
        });
      }
    }
    return parCle;
  }
}
