import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export default function EditAddress() {
  const navigate = useNavigate();
  const { address, setAddress } = useAppStore();
  const [form, setForm] = useState({
    streetNumber: address?.streetNumber || '',
    streetName: address?.streetName || '',
    postalCode: address?.postalCode || '',
    town: address?.town || '',
    country: address?.country || '',
  });

  const handleSave = () => {
    setAddress({ id: address?.id || 'guest', ...form });
    navigate('/profile');
  };

  const handleRemove = () => {
    setAddress(null);
    navigate('/profile');
  };

  return (
    <div className="min-h-full bg-cream px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} className="p-1">
          <ChevronLeft className="w-7 h-7 text-primary" />
        </button>
        <h1 className="text-xl font-extrabold text-primary">{address ? 'Edit Address' : 'Add Address'}</h1>
      </div>

      <div className="space-y-4">
        {[
          { key: 'streetNumber', label: 'Street Number' },
          { key: 'streetName', label: 'Street Name' },
          { key: 'postalCode', label: 'Postal Code' },
          { key: 'town', label: 'Town' },
          { key: 'country', label: 'Country' },
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

        <button
          onClick={handleSave}
          disabled={!form.streetNumber || !form.streetName || !form.postalCode || !form.town || !form.country}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          Save
        </button>

        {address && (
          <button
            onClick={handleRemove}
            className="w-full bg-white text-red-500 py-3 rounded-xl font-semibold"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
