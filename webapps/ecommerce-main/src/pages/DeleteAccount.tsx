import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { deleteAccount } = useAppStore();

  const handleDelete = () => {
    deleteAccount();
    navigate('/signin');
  };

  return (
    <div className="min-h-full bg-cream px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile/edit')} className="p-1">
          <ChevronLeft className="w-7 h-7 text-primary" />
        </button>
        <h1 className="text-xl font-extrabold text-primary">Delete Account</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <p className="text-sm text-gray-700 leading-relaxed">
          Deleting your account will remove all your personal data, orders, addresses and favorites. This action cannot be undone.
        </p>
      </div>

      <button
        onClick={handleDelete}
        className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold"
      >
        Delete my account
      </button>
    </div>
  );
}
