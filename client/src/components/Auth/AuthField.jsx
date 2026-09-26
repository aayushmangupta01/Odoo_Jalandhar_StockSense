import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function AuthField({ label, name, type = 'text', value, onChange, placeholder, autoComplete, required = true, minLength, helpText, inputMode }) {
  const [isVisible, setIsVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && isVisible ? 'text' : type;
  const fieldId = `auth-${name}`;

  return (
    <label className="auth-field" htmlFor={fieldId}>
      <span className="auth-field__label">{label}</span>
      <span className="auth-field__control">
        <input
          id={fieldId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          inputMode={inputMode}
          aria-describedby={helpText ? `${fieldId}-help` : undefined}
        />
        {isPassword && (
          <button
            className="auth-password-toggle"
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
          >
            {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
      {helpText && <span className="auth-field__help" id={`${fieldId}-help`}>{helpText}</span>}
    </label>
  );
}

export default AuthField;