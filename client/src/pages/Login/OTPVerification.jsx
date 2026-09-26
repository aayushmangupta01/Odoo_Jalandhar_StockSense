import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import AuthField from '../../components/Auth/AuthField';
import AuthLayout from '../../components/Auth/AuthLayout';
import AuthMessage from '../../components/Auth/AuthMessage';
import { authApi } from '../../services/authApi';

function OTPVerification() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || '';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await authApi.verifyPasswordResetCode({ email, code });
      navigate('/reset-password', { replace: true, state: { email: result.email } });
    } catch (submitError) {
      setError(submitError.message || 'Code verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!email) {
    return (
      <AuthLayout title="Verify your email" description="Start password recovery to request a verification code." step="04 / 05">
        <AuthMessage type="info">There is no active verification request in this session.</AuthMessage>
        <p className="auth-switch"><Link to="/forgot-password"><ArrowLeft size={14} /> Request a code</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Check your inbox" description={`Enter the six-digit code for ${email}.`} step="04 / 05">
      <AuthMessage type="info">Mock email delivery is enabled. Use verification code <strong>{state?.mockCode || '246810'}</strong>.</AuthMessage>
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField label="Verification code" name="otp" type="text" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" autoComplete="one-time-code" inputMode="numeric" minLength={6} />
        <AuthMessage type="error">{error}</AuthMessage>
        <button className="auth-submit" type="submit" disabled={isSubmitting || code.length !== 6}>
          {isSubmitting ? <LoaderCircle className="auth-spinner" size={17} /> : <ShieldCheck size={17} />}
          {isSubmitting ? 'Verifying...' : 'Verify code'}
          {!isSubmitting && <ArrowRight size={16} className="auth-submit__arrow" />}
        </button>
      </form>
      <p className="auth-switch"><Link to="/forgot-password"><ArrowLeft size={14} /> Change email address</Link></p>
    </AuthLayout>
  );
}

export default OTPVerification;