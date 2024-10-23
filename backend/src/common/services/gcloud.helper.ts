import { Logger } from '@nestjs/common';
import * as fs from 'fs';

const logger = new Logger('gcloud.helper');

export const initApplicationCredentials = () => {
  if (
    process.env.GCLOUD_SERVICE_ACCOUNT_KEY &&
    !process.env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    const serviceAccountFile = `${__dirname}/keyfile.json`;
    logger.log(
      `Writing Google Cloud credentials to file: ${serviceAccountFile}`
    );
    fs.writeFileSync(
      serviceAccountFile,
      process.env.GCLOUD_SERVICE_ACCOUNT_KEY
    );
    process.env.GOOGLE_APPLICATION_CREDENTIALS = serviceAccountFile;
  }
};
