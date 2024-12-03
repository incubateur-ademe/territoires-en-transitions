import { backendConfigurationSchema } from './config.model';

export default () => ({
  ...backendConfigurationSchema.parse(process.env),
});
