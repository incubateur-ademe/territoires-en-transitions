import { statsConfigurationSchema } from './configuration.model';

export default () => ({
  ...statsConfigurationSchema.parse(process.env),
});
