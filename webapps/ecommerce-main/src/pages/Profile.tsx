import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function Profile() {
  const navigate = useNavigate();
  const { user, address, signOut } = useAppStore();

  return (
    <div className="min-h-full bg-cream px-4 py-5">
      <h1 className="text-2xl font-extrabold text-primary mb-6">Profile</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <p className="text-lg font-bold text-primary">{user?.firstName} {user?.lastName}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
        <button
          onClick={() => navigate('/profile/edit')}
          className="mt-3 text-sm text-accent font-semibold"
        >
          Edit personal info
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <p className="text-sm font-bold text-primary mb-2">MY SHIPPING ADDRESS</p>
        {address ? (
          <div className="text-sm text-gray-700">
            <p>{address.streetNumber} {address.streetName}</p>
            <p>{address.postalCode} {address.town}</p>
            <p className="uppercase">{address.country}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No address saved</p>
        )}
        <button
          onClick={() => navigate('/profile/address')}
          className="mt-3 text-sm text-accent font-semibold"
        >
          {address ? 'Edit address' : 'Add address'}
        </button>
      </div>

      <button
        onClick={() => navigate('/profile/orders')}
        className="w-full bg-white rounded-xl shadow-sm px-4 py-4 mb-3 flex items-center justify-between"
      >
        <span className="font-bold text-primary">MY ORDERS</span>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      <button
        onClick={() => signOut()}
        className="w-full bg-white rounded-xl shadow-sm px-4 py-4 flex items-center justify-between text-red-500"
      >
        <span className="font-bold">Sign out</span>
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
