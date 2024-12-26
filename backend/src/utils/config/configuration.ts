import { backendConfigurationSchema } from './configuration.model';

export default () => ({
  ...backendConfigurationSchema.parse(process.env),
});
