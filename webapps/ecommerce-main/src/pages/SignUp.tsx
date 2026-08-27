import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp, user } = useAppStore();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signUp(form)) {
      navigate('/', { replace: true });
    } else {
      setError('Please fill in all fields');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-secondary/60 to-cream flex flex-col items-center justify-center px-6">
      <div className="w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center mb-6">
        <img src="/images/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {[
          { key: 'firstName', label: 'First Name', type: 'text' },
          { key: 'lastName', label: 'Last Name', type: 'text' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'password', label: 'Password', type: 'password' },
        ].map(({ key, label, type }) => (
          <input
            key={key}
            type={type}
            placeholder={label}
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-white/80 text-primary"
          />
        ))}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-full font-semibold"
        >
          Sign Up
        </button>
      </form>

      <p className="mt-6 text-primary">
        Already have an account ?{' '}
        <button onClick={() => navigate('/signin')} className="font-bold underline">Sign In</button>
      </p>
    </div>
  );
}
