import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react';
import AuthField from '../../components/Auth/AuthField';
import AuthLayout from '../../components/Auth/AuthLayout';
import AuthMessage from '../../components/Auth/AuthMessage';
import { authApi } from '../../services/authApi';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = location.state?.message;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.login({ email, password });
      navigate('/', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" description="Sign in to continue to your inventory workspace." step="01 / 05">
      {successMessage && <AuthMessage type="success">{successMessage}</AuthMessage>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField label="Work email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" />
        <div className="auth-field-stack">
          <AuthField label="Password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" minLength={8} />
          <Link className="auth-inline-link" to="/forgot-password">Forgot password?</Link>
        </div>
        <AuthMessage type="error">{error}</AuthMessage>
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="auth-spinner" size={17} /> : <LockKeyhole size={16} />}
          {isSubmitting ? 'Signing in...' : 'Sign in'}
          {!isSubmitting && <ArrowRight size={16} className="auth-submit__arrow" />}
        </button>
      </form>

      <AuthMessage type="info">Demo access: <strong>demo@stocksense.app</strong> / <strong>StockSense123!</strong></AuthMessage>
      <p className="auth-switch">New to StockSense? <Link to="/signup">Create an account <ArrowRight size={14} /></Link></p>
    </AuthLayout>
  );
}

export default Login;