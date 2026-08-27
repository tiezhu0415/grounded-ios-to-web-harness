import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export default function SignIn() {
  const navigate = useNavigate();
  const { signIn, user } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Already signed in
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signIn(email, password)) {
      navigate('/', { replace: true });
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-secondary/60 to-cream flex flex-col items-center justify-center px-6">
      <div className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center mb-6">
        <img src="/images/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/80 text-primary"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/80 text-primary"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-full font-semibold"
        >
          Sign In
        </button>
      </form>

      <button
        onClick={() => navigate('/reset-password')}
        className="mt-4 text-sm text-primary bg-white/50 px-4 py-2 rounded-full"
      >
        Forgot password ?
      </button>

      <p className="mt-6 text-primary">
        Don’t have an account ?{' '}
        <button onClick={() => navigate('/signup')} className="font-bold underline">Sign Up</button>
      </p>
    </div>
  );
}
