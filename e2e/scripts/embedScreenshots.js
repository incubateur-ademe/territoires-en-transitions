// copié et adapté depuis: https://github.com/jcundill/cypress-cucumber-preprocessor/blob/master/fixJson.js
// permet d'ajouter dans le rapport de tests les screenshots générés lorsqu'un step est en erreur

const fs = require('fs');
const path = require('path');

const args = process.argv;

// chemin sur le répertoire contenant les rapports json
const cucumberJsonDir = args[2] || './cypress/cucumber-json';
// chemin sur le répertoire contenant les captures d'écran et les vidéos
const screenshotsDir = args[3] || './cypress/screenshots';
const videosDir = args[4] || './cypress/videos';

// normalisation des chemins
const jsonPath = path.join(__dirname, '..', cucumberJsonDir);
const screenshotsPath = path.join(__dirname, '..', screenshotsDir);
const videosPath = path.join(__dirname, '..', videosDir);

// lecture des rapports json
const reportsByFeature = parseReports();

// liste les répertoires de captures générés par l'éxecution des tests et correspondant aux tests en échec (ou en ré-essai)
let failingFeatures = [];
try {
  failingFeatures = fs.readdirSync(screenshotsPath);
} catch (err) {
  console.log('no failing features');
}

failingFeatures.forEach((feature) => {
  const screenshots = fs.readdirSync(path.join(screenshotsPath, feature));
  screenshots.forEach((screenshot) => attachScreenshot(feature, screenshot));
});

function parseReports() {
  // liste les fichiers du répertoire
  const fileNames = fs.readdirSync(jsonPath);

  return fileNames.reduce((reports, fileName) => {
    const json = JSON.parse(
      fs.readFileSync(path.join(jsonPath, fileName)).toString()
    );
    const report = json[0];
    if (!report) {
      console.error('rapport non valide ?', json);
      return reports;
    }
    const featureName = report.uri.split('/').reverse()[0];
    return {
      ...reports,
      [featureName]: { fileName, report },
    };
  }, {});
}

function getScenario(screenshot, elements, attempt) {
  const reScenario = /.*-- (.*)\(failed\)(?: attempt (\d))?/;
  const match = screenshot.match(reScenario);
  if (!match) return null;
  const scenarioName = match[1].trim();
  const scenario = elements.find((e) => e.name === scenarioName);
  return {
    scenario,
    scenarioName,
    attempt,
  };
}

function getExampleScenario(screenshot, elements) {
  const reExampleScenario = /.*-- (.*)\(example #(\d+)\)(?: attempt (\d))?/;
  const match = screenshot.match(reExampleScenario);
  if (!match) return null;
  const scenarioName = match[1].trim();
  const exampleIndex = match[2];
  const scenario = elements.filter((e) => e.name === scenarioName)[
    exampleIndex - 1
  ];
  return {
    scenario,
    scenarioName,
    exampleIndex,
  };
}

function createStep(screenshot) {
  const reAttemptNum = /.* -- (.*)attempt (\d)/;
  const match = screenshot.match(reAttemptNum);
  const attempt = match?.[1] || 1;
  console.warn(`Avertissement généré pour la capture:\n(${screenshot})`);
  return {
    arguments: [],
    keyword: '* ',
    line: 1,
    name: `Note : Le test est passé mais la tentative n°${attempt} a généré une capture d'écran.`,
    result: {
      status: 'ambiguous',
      duration: 1,
    },
  };
}

function getScreenshotImage(screenshotsPath, feature, screenshot) {
  const data = fs.readFileSync(path.join(screenshotsPath, feature, screenshot));

  if (data) {
    const base64Image = Buffer.from(data, 'binary').toString('base64');
    return { data: base64Image, mime_type: 'image/png' };
  }
  return null;
}

function attachScreenshot(feature, screenshot) {
  if (!reportsByFeature[feature]) {
    return;
  }
  const { report, fileName } = reportsByFeature[feature];
  const elements = report.elements;

  // retrouve le scénario à partir du nom de la capture
  const { scenario, scenarioName, exampleIndex } =
    getScenario(screenshot, elements) ||
    getExampleScenario(screenshot, elements) ||
    {};
  if (!scenario) {
    return;
  }

  // retrouve la 1ère étape en erreur du scénario
  let step = scenario.steps.find((s) => s.result?.status !== 'passed');

  // à défaut on en crée une
  if (!step) {
    step = createStep(screenshot);
    scenario.steps.push(step);
  }

  // attache la capture à l'étape concernée ou à celle ajoutée
  const image = getScreenshotImage(screenshotsPath, feature, screenshot);
  step.embeddings = [...(step.embeddings || []), image];

  // sauvegarde le rapport modifié
  fs.writeFileSync(
    path.join(jsonPath, fileName),
    JSON.stringify([report], null, 2)
  );
}
