import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LoaderCircle, UserRoundPlus } from 'lucide-react';
import AuthField from '../../components/Auth/AuthField';
import AuthLayout from '../../components/Auth/AuthLayout';
import AuthMessage from '../../components/Auth/AuthMessage';
import { authApi } from '../../services/authApi';

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
      await authApi.signup({ name, email, password });
      navigate('/login', { replace: true, state: { message: 'Account created. Sign in with your new credentials.' } });
    } catch (submitError) {
      setError(submitError.response?.data?.error || submitError.message || 'Account creation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" description="Set up access for your inventory workspace." step="02 / 05">
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField label="Your name" name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" autoComplete="name" minLength={2} />
        <AuthField label="Work email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" />
        <AuthField label="Password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" autoComplete="new-password" minLength={10} />
        <AuthField label="Confirm password" name="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter the password again" autoComplete="new-password" minLength={10} />
        <AuthMessage type="error">{error}</AuthMessage>
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="auth-spinner" size={17} /> : <UserRoundPlus size={17} />}
          {isSubmitting ? 'Creating account...' : 'Create account'}
          {!isSubmitting && <ArrowRight size={16} className="auth-submit__arrow" />}
        </button>
        <p className="auth-legal">By creating an account, you agree to keep your workspace credentials secure.</p>
      </form>
      <p className="auth-switch">Already have access? <Link to="/login">Sign in <ArrowRight size={14} /></Link></p>
    </AuthLayout>
  );
}

export default Signup;