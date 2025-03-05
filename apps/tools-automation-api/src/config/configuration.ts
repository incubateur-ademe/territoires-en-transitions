import { toolsAutomationApiConfigurationSchema } from './configuration.model';

export default () => ({
  ...toolsAutomationApiConfigurationSchema.parse(process.env),
});
