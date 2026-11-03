import { readChoicesFromText } from './assistant-interactions';

describe('readChoicesFromText', () => {
  const choices = {
    question: 'Quel aspect des retours ?',
    options: ['Volume', 'Types de retours'],
  };

  test('lit les choix écrits en JSON, avec ou sans bloc de code', () => {
    expect(readChoicesFromText(JSON.stringify(choices))).toEqual(choices);
    expect(
      readChoicesFromText(`\`\`\`json\n${JSON.stringify(choices)}\n\`\`\``)
    ).toEqual(choices);
  });

  test('ignore une réponse ordinaire ou un JSON qui ne propose rien', () => {
    expect(readChoicesFromText('Voici les chiffres : …')).toBeNull();
    expect(readChoicesFromText('{"question": "?", "options": []}')).toBeNull();
    expect(readChoicesFromText('{ pas du json')).toBeNull();
    expect(readChoicesFromText(null)).toBeNull();
  });
});
