import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from 'lucide-react';
import AuthField from '../../components/Auth/AuthField';
import AuthLayout from '../../components/Auth/AuthLayout';
import AuthMessage from '../../components/Auth/AuthMessage';
import { authApi } from '../../services/authApi';

function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authApi.resetPassword({ email, password });
      navigate('/login', { replace: true, state: { message: result.message } });
    } catch (submitError) {
      setError(submitError.message || 'Password reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!email) {
    return (
      <AuthLayout title="Choose a new password" description="Verify your email before resetting your password." step="05 / 05">
        <AuthMessage type="info">Complete email verification first to continue.</AuthMessage>
        <p className="auth-switch"><Link to="/forgot-password"><ArrowLeft size={14} /> Start password recovery</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" description={`Set a new password for ${email}.`} step="05 / 05">
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField label="New password" name="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} />
        <AuthField label="Confirm new password" name="confirm-new-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter the password again" autoComplete="new-password" minLength={8} />
        <AuthMessage type="error">{error}</AuthMessage>
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="auth-spinner" size={17} /> : <Check size={17} />}
          {isSubmitting ? 'Updating password...' : 'Update password'}
          {!isSubmitting && <ArrowRight size={16} className="auth-submit__arrow" />}
        </button>
      </form>
      <p className="auth-switch"><Link to="/login"><ArrowLeft size={14} /> Back to sign in</Link></p>
    </AuthLayout>
  );
}

export default ResetPassword;