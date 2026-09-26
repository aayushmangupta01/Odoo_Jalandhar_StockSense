import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const icons = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

function AuthMessage({ type = 'info', children }) {
  if (!children) return null;
  const Icon = icons[type] || icons.info;

  return (
    <div className={`auth-message auth-message--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={17} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export default AuthMessage;