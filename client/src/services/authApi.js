const MOCK_OTP = '246810';
const accounts = new Map([
  ['demo@stocksense.app', { name: 'Inventory Manager', password: 'StockSense123!' }],
]);
const resetChallenges = new Map();
const verifiedResets = new Set();

function simulateRequest(result) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(result), 350);
  });
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export const authApi = {
  async login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const account = accounts.get(normalizedEmail);
    await simulateRequest();

    if (!account || account.password !== password) {
      throw new Error('The email or password is incorrect. Please try again.');
    }

    return { user: { email: normalizedEmail, name: account.name } };
  },

  async signup({ name, email, password }) {
    const normalizedEmail = normalizeEmail(email);
    await simulateRequest();

    if (accounts.has(normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    accounts.set(normalizedEmail, { name: name.trim(), password });
    return { message: 'Your StockSense account is ready.' };
  },

  async requestPasswordReset(email) {
    const normalizedEmail = normalizeEmail(email);
    await simulateRequest();
    resetChallenges.set(normalizedEmail, MOCK_OTP);
    verifiedResets.delete(normalizedEmail);

    return {
      email: normalizedEmail,
      message: 'A verification code has been prepared for this address.',
      mockCode: MOCK_OTP,
    };
  },

  async verifyPasswordResetCode({ email, code }) {
    const normalizedEmail = normalizeEmail(email);
    await simulateRequest();

    if (resetChallenges.get(normalizedEmail) !== code.trim()) {
      throw new Error('That verification code is not correct. Check it and try again.');
    }

    verifiedResets.add(normalizedEmail);
    return { email: normalizedEmail };
  },

  async resetPassword({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    await simulateRequest();

    if (!verifiedResets.has(normalizedEmail)) {
      throw new Error('Verify your email code before resetting the password.');
    }

    const account = accounts.get(normalizedEmail);
    if (!account) {
      throw new Error('No account was found for this email. Create an account first.');
    }

    accounts.set(normalizedEmail, { ...account, password });
    resetChallenges.delete(normalizedEmail);
    verifiedResets.delete(normalizedEmail);
    return { message: 'Your password has been updated.' };
  },
};

export default authApi;