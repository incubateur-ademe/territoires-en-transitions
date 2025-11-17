import {
  toolsAutomationApiConfigurationSchema,
  ToolsAutomationApiConfigurationType,
} from './configuration.model';

export default (): ToolsAutomationApiConfigurationType => ({
  ...toolsAutomationApiConfigurationSchema.parse(process.env),
});
