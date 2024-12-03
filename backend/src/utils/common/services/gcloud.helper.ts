import { Logger } from '@nestjs/common';
import * as fs from 'fs';

const logger = new Logger('gcloud.helper');

export const initGoogleCloudCredentials = () => {
  if (
    process.env.GCLOUD_SERVICE_ACCOUNT_KEY &&
    !process.env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    const serviceAccountFile = `${__dirname}/keyfile.json`;
    logger.log(
      `Writing Google Cloud credentials to file: ${serviceAccountFile}`
    );
    let credentialsJson = process.env.GCLOUD_SERVICE_ACCOUNT_KEY;
    if (!credentialsJson.includes('{')) {
      // Assume it's a base64 encoded string
      credentialsJson = Buffer.from(credentialsJson, 'base64').toString(
        'utf-8'
      );
    }

    fs.writeFileSync(serviceAccountFile, credentialsJson);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountFile;
  }
};
