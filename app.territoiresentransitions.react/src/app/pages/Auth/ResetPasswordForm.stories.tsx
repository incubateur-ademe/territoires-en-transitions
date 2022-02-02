import ResetPasswordForm from './ResetPasswordForm';

export default {
  component: ResetPasswordForm,
};

export const Default = () => <ResetPasswordForm token="fake" />;

export const Failure = () => (
  <ResetPasswordForm
    token="fake"
    initialState={{
      _formState: 'failure',
      _errorMsg: 'some api error message here',
    }}
  />
);

export const Success = () => (
  <ResetPasswordForm
    token="fake"
    initialState={{
      _formState: 'success',
    }}
  />
);
