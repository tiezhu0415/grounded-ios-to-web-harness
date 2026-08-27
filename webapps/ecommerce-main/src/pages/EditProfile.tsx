import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile, signOut } = useAppStore();
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
  });

  const handleSave = () => {
    updateProfile(form);
    navigate('/profile');
  };

  return (
    <div className="min-h-full bg-cream px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} className="p-1">
          <ChevronLeft className="w-7 h-7 text-primary" />
        </button>
        <h1 className="text-xl font-extrabold text-primary">Edit Profile</h1>
      </div>

      <div className="space-y-4">
        {[
          { key: 'firstName', label: 'First Name' },
          { key: 'lastName', label: 'Last Name' },
          { key: 'phoneNumber', label: 'Phone Number' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-primary mb-1">{label}</label>
            <input
              type="text"
              value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-primary"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-semibold text-primary mb-1">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-100 text-gray-500"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
        >
          Save
        </button>

        <button
          onClick={() => signOut()}
          className="w-full bg-white text-red-500 py-3 rounded-xl font-semibold"
        >
          Sign out
        </button>

        <button
          onClick={() => navigate('/profile/delete-account')}
          className="w-full bg-white text-red-500 py-3 rounded-xl font-semibold"
        >
          Delete my account
        </button>
      </div>
    </div>
  );
}
