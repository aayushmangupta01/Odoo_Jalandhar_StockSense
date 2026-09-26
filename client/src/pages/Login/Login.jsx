import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, LoaderCircle, LockKeyhole, ShieldCheck, UsersRound } from 'lucide-react';
import AuthField from '../../components/Auth/AuthField';
import AuthLayout from '../../components/Auth/AuthLayout';
import AuthMessage from '../../components/Auth/AuthMessage';
import { authApi } from '../../services/authApi';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successMessage = location.state?.message;
  const demoAdminEmail = import.meta.env.DEV ? import.meta.env.VITE_DEMO_ADMIN_EMAIL : undefined;
  const demoAdminPassword = import.meta.env.DEV ? import.meta.env.VITE_DEMO_ADMIN_PASSWORD : undefined;
  const hasDemoAdmin = Boolean(demoAdminEmail && demoAdminPassword);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.login({ email, password, role });
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError.response?.data?.error || submitError.message || 'Sign in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title={role === 'admin' ? 'Admin sign in' : 'Staff sign in'}
      description={
        role === 'admin'
          ? 'Sign in to manage your StockSense inventory workspace.'
          : 'Sign in to continue your day-to-day inventory work.'
      }
      step="01 / 05"
    >
      {successMessage && <AuthMessage type="success">{successMessage}</AuthMessage>}
      <div className="auth-role-switch" role="group" aria-label="Choose account type">
        <button
          className={`auth-role-switch__option${role === 'staff' ? ' is-selected' : ''}`}
          type="button"
          onClick={() => {
            setRole('staff');
            setError('');
          }}
          aria-pressed={role === 'staff'}
        >
          <UsersRound size={16} />
          <span>Staff</span>
        </button>
        <button
          className={`auth-role-switch__option${role === 'admin' ? ' is-selected' : ''}`}
          type="button"
          onClick={() => {
            setRole('admin');
            setError('');
          }}
          aria-pressed={role === 'admin'}
        >
          <ShieldCheck size={16} />
          <span>Admin</span>
        </button>
      </div>
      {role === 'admin' && hasDemoAdmin && (
        <div className="auth-demo-credentials">
          <div className="auth-demo-credentials__heading">
            <strong>Demo Admin account</strong>
            <span>Local development only</span>
          </div>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{demoAdminEmail}</dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>{demoAdminPassword}</dd>
            </div>
          </dl>
          <button
            className="auth-demo-credentials__action"
            type="button"
            onClick={() => {
              setEmail(demoAdminEmail);
              setPassword(demoAdminPassword);
              setError('');
            }}
          >
            Use these credentials
          </button>
        </div>
      )}
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField label={role === 'admin' ? 'Admin email' : 'Staff email'} name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={role === 'admin' ? 'admin@company.com' : 'you@company.com'} autoComplete="email" />
        <div className="auth-field-stack">
          <AuthField label="Password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" minLength={8} />
          <Link className="auth-inline-link" to="/forgot-password">Forgot password?</Link>
        </div>
        <AuthMessage type="error">{error}</AuthMessage>
        <button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle className="auth-spinner" size={17} /> : <LockKeyhole size={16} />}
          {isSubmitting ? 'Signing in...' : `Sign in as ${role === 'admin' ? 'Admin' : 'Staff'}`}
          {!isSubmitting && <ArrowRight size={16} className="auth-submit__arrow" />}
        </button>
      </form>

      <AuthMessage type="info">
        {role === 'admin'
          ? hasDemoAdmin
            ? 'This generated demo account is for local development only.'
            : 'Use the Admin credentials configured by your server administrator.'
          : 'Staff accounts are assigned to a warehouse by an administrator.'}
      </AuthMessage>
      <p className="auth-switch">New to StockSense? <Link to="/signup">Create an account <ArrowRight size={14} /></Link></p>
    </AuthLayout>
  );
}

export default Login;