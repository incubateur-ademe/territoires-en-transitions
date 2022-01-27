import {PasswordStrengthMeter} from './PasswordStrengthMeter';

export default {
  component: PasswordStrengthMeter,
};

export const Nul = () => <PasswordStrengthMeter score={0} />;

export const Faible = () => <PasswordStrengthMeter score={1} />;

export const Passable = () => <PasswordStrengthMeter score={2} />;

export const Bon = () => <PasswordStrengthMeter score={3} />;

export const Robuste = () => <PasswordStrengthMeter score={4} />;
