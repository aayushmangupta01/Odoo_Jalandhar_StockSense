import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LoaderCircle, Mail } from 'lucide-react';
import AuthField from '../../components/Auth/AuthField';
import AuthLayout from '../../components/Auth/AuthLayout';
import AuthMessage from '../../components/Auth/AuthMessage';
import { authApi } from '../../services/authApi';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await authApi.requestPasswordReset(email);
      navigate('/verify-otp', { state: { email: result.email, mockCode: result.mockCode } });
    } catch (submitError) {
      setError(submitError.message || 'Unable to start password recovery.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Reset your password" description="Enter your account email and we’ll prepare a verification code." step="03 / 05">
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField label="Work email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" />
        <AuthMessage type="error">{error}</AuthMessage>
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="auth-spinner" size={17} /> : <Mail size={17} />}
          {isSubmitting ? 'Preparing code...' : 'Send verification code'}
          {!isSubmitting && <ArrowRight size={16} className="auth-submit__arrow" />}
        </button>
      </form>
      <p className="auth-switch"><Link to="/login"><ArrowLeft size={14} /> Back to sign in</Link></p>
    </AuthLayout>
  );
}

export default ForgotPassword;