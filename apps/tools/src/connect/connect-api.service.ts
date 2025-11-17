import type { AppRouter } from '@/backend/utils/trpc/trpc.router';
import ConfigurationService from '../config/configuration.service';
import { Injectable, Logger } from '@nestjs/common';
import { inferProcedureOutput } from '@trpc/server';
import { contactSchema, ContactUpsert } from './contact.model';

const SOURCE_TET = 'Territoires en Transitions';

type Membre = inferProcedureOutput<
  AppRouter['collectivites']['membres']['listExportConnect']
>[number];

/**
 * Accès à l'API Connect
 */
@Injectable()
export class ConnectApiService {
  private readonly logger = new Logger(ConnectApiService.name);
  private readonly apiUrl = this.configurationService.get('CONNECT_URL');
  private readonly headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    client_id: this.configurationService.get('CONNECT_CLIENT_ID'),
    client_secret: this.configurationService.get('CONNECT_CLIENT_SECRET'),
  };

  constructor(private readonly configurationService: ConfigurationService) {}

  /** Donne l'url pour lire/ajouter/màj un contact */
  private getUrl(email: string, isNew = false) {
    const url = `${this.apiUrl}/personnes`;
    return isNew ? url : `${url}/mail/${encodeURIComponent(email)}`;
  }

  /** Ajoute ou màj un contact */
  async upsertContact(membre: Membre) {
    const {
      userId,
      collectivite,
      email,
      nom,
      prenom,
      siren,
      nic,
      detailsFonction,
      telephone,
      exportId,
    } = membre;
    if (!siren || !nic) {
      this.logger.log(
        `Connect: code SIREN ou NIC non renseigné pour la collectivité ${collectivite}`
      );
      return false;
    }

    // vérifie si un contact existe déjà
    const contactExistant = await this.getContact(exportId || email);
    const ancienMail = exportId && exportId !== email ? exportId : undefined;

    // données à insérer/màj
    const contact: ContactUpsert = {
      email,
      nom: (nom ?? contactExistant?.nom) || undefined,
      prenom: (prenom ?? contactExistant?.prenom) || undefined,
      siret: `${siren}${nic}`,
      telephone: telephone || undefined,
      fonction: detailsFonction || undefined,
      source: SOURCE_TET,
      ancienMail,
    };

    const method = contactExistant ? 'PUT' : 'POST';
    const response = await fetch(this.getUrl(email, !contactExistant), {
      method,
      headers: this.headers,
      body: JSON.stringify(contact),
    });

    if (response.ok) {
      this.logger.log(
        `Connect: contact ${userId} ${
          contactExistant ? 'mis à jour' : 'ajouté'
        }`
      );
      this.logger.log(
        `${method} ${this.getUrl(email, !contactExistant)}: ${JSON.stringify(
          contact,
          null,
          2
        )}`
      );
      return true;
    }

    this.logger.log(
      `Connect: erreur ${
        contactExistant ? 'de mise à jour' : "d'ajout"
      } du contact (${response.status}: ${response.statusText})`
    );
    return false;
  }

  /** Lit les données d'un contact existant */
  async getContact(email: string) {
    this.logger.log(`Connect: récupération du contact ${email}`);
    try {
      const response = await fetch(this.getUrl(email), {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        this.logger.log(
          `Connect: contact non trouvé (${response.status}: ${response.statusText})`
        );
        return null;
      }

      const content = await response.json();
      this.logger.log(
        `Connect: ${content.message} (${response.status}: ${response.statusText})`
      );
      const { data: contact, success } = contactSchema.safeParse(
        content.contact
      );
      return success ? contact : null;
    } catch (error) {
      this.logger.log(`Connect: erreur de récupération du contact ${error}`);
    }
  }
}
