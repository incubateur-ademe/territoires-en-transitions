import { Injectable, Logger } from '@nestjs/common';
import { userCrm } from '../../auth/models/user-crm.dto';
import ConfigurationService from '../../config/configuration.service';

@Injectable()
export default class BrevoService {
  private readonly logger = new Logger(BrevoService.name);

  constructor(
    private readonly configurationService: ConfigurationService,
  ) {}

  private readonly brevoKey =
    this.configurationService.get('BREVO_API_KEY');
  private readonly headers = {
    Accept: 'application/json',
    'Api-key': `${this.brevoKey}`,
    'Content-type': 'application/json',
  };
  private readonly urlContact = 'https://api.brevo.com/v3/contacts/';

  /**
   * Récupère les informations d'un contact Brevo via son email
   * https://developers.brevo.com/reference/getcontactinfo-1
   * @param email
   * @return le contact sous format json, null s'il n'existe pas
   */
  async getContactByEmail(email: string): Promise<any> {
    const response = await fetch(this.urlContact + email, {
      method: 'GET',
      headers: this.headers,
    });
    if (!response.ok) {
      if (response.status == 404) {
        // L'utilisateur n'existe pas dans Brevo
        return null;
      } else {
        throw new Error(`Error! status: ${response.status}`);
      }
    }
    return await response.json();
  }

  /**
   * Ajoute des contacts à une liste Brevo via leurs emails
   * https://developers.brevo.com/reference/addcontacttolist-1
   * @param emails
   * @param list
   */
  async addContactsToList(emails: string[], list: number): Promise<any> {
    const response = await fetch(
      this.urlContact + 'lists/' + list + '/contacts/add',
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ emails: emails }),
      },
    );
    if (!response.ok) {
      console.log(
        'Les contacts ' +
          emails +
          " n'ont pas pu être ajouté à la liste #" +
          list +
          '.',
      );
      return null;
    }
    return await response.json();
  }

  /**
   * Ajoute un contact à Brevo
   * https://developers.brevo.com/reference/createcontact
   * @param user (nom, prenom, derniere_connexion, email)
   */
  async addContact(user: userCrm): Promise<any> {
    const response = await fetch(this.urlContact, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        attributes: {
          NOM: user.nom,
          PRENOM: user.prenom,
          DATECONNEXION: user.derniereConnexion,
        },
        updateEnabled: false,
        email: user.email,
      }),
    });
    if (!response.ok) {
      console.log('Le contact ' + user.email + " n'a pas pu être créé.");
      return null;
    }
    return await response.json();
  }

  /**
   * Enlève des contacts à une liste Brevo via leurs emails
   * https://developers.brevo.com/reference/removecontactfromlist
   * @param emails
   * @param list
   */
  async removeContactsFromList(emails: string[], list: number): Promise<any> {
    const response = await fetch(
      this.urlContact + 'lists/' + list + '/contacts/remove',
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ emails: emails }),
      },
    );
    if (!response.ok) {
      console.log(
        'Les contacts ' +
          emails +
          " n'ont pas pu être enlevé de la liste #" +
          list +
          '.',
      );
      return null;
    }
    return await response.json();
  }
}
