import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-full bg-cream px-6 py-10">
      <h1 className="text-2xl font-extrabold text-primary mb-6">Reset Password</h1>

      {sent ? (
        <p className="text-primary">A reset link has been sent to {email}.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-primary"
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-xl font-semibold"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => navigate('/signin')}
            className="w-full bg-white text-primary py-3 rounded-xl font-semibold"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
