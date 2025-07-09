import { When } from '@badeball/cypress-cucumber-preprocessor';

import { LocalSelectors } from './selectors';

beforeEach(() => {
  // enregistre les définitions locales
  cy.wrap(LocalSelectors).as('LocalSelectors', { type: 'static' });
});

/** Vérification des questions/réponse **/
When(/la liste des questions contient les entrées suivantes/, (dataString) => {
  // sélectionne le dialogue
  cy.get(LocalSelectors['dialogue Personnaliser le potentiel'].selector).within(
    () => {
      checkQuestionsReponses(dataString);
    }
  );
});
When(
  'la page thématique contient entre autres les questions suivantes :',
  (dataString) => {
    cy.get('[data-test=thematique]').within(() => {
      checkQuestionsReponses(dataString);
    });
  }
);

/** Saisie les réponses */
When('je complète les questions avec les valeurs suivantes :', (dataString) =>
  setReponses(dataString)
);

When('je clique sur la thématique {string}', (thematique) => {
  cy.get('[data-test=personnalisation] a').contains(thematique).click();
});

When("je clique sur l'avant-dernière thématique", (thematique) => {
  cy.get('[data-test=personnalisation] a:nth(-2)').click();
});
When('je clique sur la dernière thématique', (thematique) => {
  cy.get('[data-test=personnalisation] a:nth(-1)').click();
});

When('la page contient plus de {int} thématiques', (count) =>
  cy.get('[data-test=personnalisation] a').should('have.length.gt', count)
);
When('la page contient moins de {int} thématiques', (count) =>
  cy.get('[data-test=personnalisation] a').should('have.length.lt', count)
);

const checkQuestionsReponses = (dataString) => {
  const qr = parseQuestionsReponses(dataString);

  // pour chaque question/réponse attendue
  cy.wrap(qr).each(({ label, type, valeur, nbOptions }, index) => {
    // sélectionne la réponse à partir du libellé de la question
    getReponseByQuestionLabel(label).within(() => {
      // et vérifie la réponse en fonction du type
      switch (type) {
        case 'binaire':
          if (valeur === '') {
            assertAllRadioButtonsAreOff(2);
          } else if (valeur === 'oui' || valeur === 'non') {
            assertRadioButtonIsOn(valeur);
          } else {
            assert(false, 'réponse non attendue');
          }
          break;

        case 'choix':
          if (valeur === '') {
            assertAllRadioButtonsAreOff(nbOptions);
          } else {
            assertRadioButtonIsOn(valeur);
          }
          break;

        case 'part':
          cy.get('input[inputmode=numeric]').should('have.value', valeur);
          break;
      }
    });
  });
};

const setReponses = (dataString) => {
  const qr = parseQuestionsReponses(dataString);

  // pour chaque question/réponse attendue
  cy.wrap(qr).each(({ label, type, valeur }, index) => {
    // sélectionne la réponse à partir du libellé de la question
    getReponseByQuestionLabel(label).within(() => {
      // clic sur le bouton "Modifier" avant de sélectionner un nouvelle valeur
      // si nécessaire
      const { modValue, modifyBeforeUpdate } = getModifyValue(valeur);
      if (modifyBeforeUpdate) {
        cy.get('button').contains('Modifier').click();
      }

      // et fixe la réponse attendue en fonction du type
      switch (type) {
        case 'binaire':
          // le <input> est caché pour être stylé => on clique sur le parent
          cy.get(`input[type=radio][value=${modValue}]`).parent().click();
          break;

        case 'choix':
          cy.get(`input[type=radio][value=${modValue}]`).parent().click();
          break;

        case 'part':
          cy.get('input[inputmode=numeric]').type(
            '{selectall}{backspace}' + modValue
          );
          break;
      }
    });
  });

  // attends un peu avant de passer à l'étape suivante pour que les
  // modifications soient bien prises en compte
  cy.wait(250);
};

// pour le type binaire ou choix
const getModifyValue = (valeur) => {
  // si la valeur est préfixée par `[MODIFIER]->` cela indique que le bouton
  // "Modifier" doit être cliqué avant que la valeur puisse être modifié
  const modify = valeur?.split('[MODIFIER]->');
  if (modify?.length === 2) {
    return { modValue: modify[1], modifyBeforeUpdate: true };
  }

  return { modValue: valeur };
};

// sélectionne la réponse à partir du libellé de la question
const getReponseByQuestionLabel = (label) =>
  cy.get('legend').contains(label).parent().find(`[data-test=reponse]`);

// vérifie qu'un bouton radio est sélectionné
const assertRadioButtonIsOn = (value) => {
  assertOneRadioButtonIsOn();
  cy.get(`input[type=radio][value=${value}]`).should('be.checked');
};
const assertOneRadioButtonIsOn = () => {
  // quand une option est sélectionnée les autres boutons radio sont absents
  cy.get('input[type=radio]').should('have.length', 1);
  // et un bouton "Modifier" est visible
  cy.get('button').contains('Modifier').should('be.enabled');
};

// vérifie qu'aucun bouton radio n'est sélectionné
const assertAllRadioButtonsAreOff = (length) => {
  // quand aucune option n'est sélectionnée tous les boutons radio sont visibles et non cochés
  cy.get('input[type=radio]')
    .should('have.length', length)
    .should('not.have.attr', 'checked');
  // et il n'y a pas de bouton "Modifier"
  cy.get('button').should('not.exist');
};

// fait le parsing d'un bloc lignes dans le format suivant :
// <libellé de la question>\n
// <type>: <valeur | non définie>\n
// ...
const VALID_TYPES = ['binaire', 'choix', 'part'];
const VALID_BINARY_VALUES = ['oui', 'non', ''];
const RE_CHOIX = /^choix\((\d+)\)$/;
const CHOIX_BINAIRE = { oui: 'true', non: 'false' };

const parseQuestionsReponses = (dataString) => {
  const qr = [];
  dataString
    .split('\n') // sépare les lignes
    .map((s) => s.trim()) // enlève les espaces en début/fin de chaine
    .filter((s) => !!s) // ignore les lignes vides
    .forEach((l, index, lines) => {
      // parcours les lignes 2 à 2
      if (index % 2 === 0 && index + 1 < lines.length) {
        // le libellé est sur la ligne courante
        const label = lines[index].trim();
        // le type et la valeur sur la suivante, séparés par ':'
        const [t, v] = lines[index + 1].split(':').map((s) => s.trim());
        const valeur = v === 'non définie' || v === undefined ? '' : v;
        const type = t?.startsWith('choix') ? 'choix' : t;
        assert(
          VALID_TYPES.includes(type),
          `syntaxe attendue "${VALID_TYPES.join(
            '|'
          )}: <valeur>" (reçu: ${type})`
        );

        let props = {};
        switch (type) {
          case 'binaire':
            assert(
              VALID_BINARY_VALUES.includes(valeur),
              `syntaxe attendue "binaire: <${VALID_BINARY_VALUES.join(
                '|'
              )}>" (reçu: ${JSON.stringify(valeur)})`
            );
            props = { valeur };
            break;

          case 'choix':
            // cas spécial type=choix(<nombre d'options>)
            const match = t.match(RE_CHOIX);
            assert(
              match?.length === 2,
              `syntaxe attendue "choix(<nombre d'options>): <valeur>"`
            );
            props = { nbOptions: parseInt(match[1]) };
            break;
        }

        qr.push({
          label,
          type,
          valeur,
          ...props,
        });
      }
    });
  return qr;
};
