import { useCallback, useState } from 'react';
import type { Order, Profile, ShippingAddress } from '../../services/profileService';
import {
  deleteAccount,
  getOrders,
  getProfile,
  getShippingAddress,
  removeShippingAddress,
  saveShippingAddress,
  signOut,
  updateProfile,
} from '../../services/profileService';
import { ChevronRightIcon, PencilIcon, PlusCircleIcon, ShippingBoxIcon, SignOutIcon } from './Icons';
import { DeleteAccountPage, EditPersonalInfoPage } from './EditProfilePage';
import { OrderDetailsPage, OrderListPage } from './OrderViews';

type ProfileMode =
  | 'profile'
  | 'address-form'
  | 'orders'
  | 'order-detail'
  | 'app-settings'
  | 'edit-personal-info'
  | 'delete-account';

interface ProfilePageProps {
  onSignOut: () => void;
}

const PRIMARY = '#2F2440';
const ACCENT = '#710117';
const TAB_BG = '#F6EEE0';
const SECONDARY_BG = '#F2F2F7';
const SECONDARY_LABEL = '#8E8E93';

function useProfileState() {
  const [profile, setProfile] = useState<Profile>(getProfile);
  const [address, setAddress] = useState<ShippingAddress | null>(getShippingAddress);

  const update = useCallback((next: Partial<Profile>) => {
    setProfile(updateProfile(next));
  }, []);

  const saveAddress = useCallback((next: ShippingAddress) => {
    setAddress(saveShippingAddress(next));
  }, []);

  const removeAddress = useCallback(() => {
    removeShippingAddress();
    setAddress(null);
  }, []);

  return { profile, address, update, saveAddress, removeAddress };
}

export function ProfilePage({ onSignOut }: ProfilePageProps) {
  const { profile, address, update, saveAddress, removeAddress } = useProfileState();
  const [mode, setMode] = useState<ProfileMode>('profile');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = useCallback(() => {
    signOut();
    onSignOut();
  }, [onSignOut]);

  const handleEditProfile = useCallback(() => {
    setMode('edit-personal-info');
  }, []);

  const handleShowOrders = useCallback(() => {
    setMode('orders');
  }, []);

  const handleSelectOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setMode('order-detail');
  }, []);

  const handleShowAppSettings = useCallback(() => {
    setMode('app-settings');
  }, []);

  const handleBackToOrders = useCallback(() => {
    setMode('orders');
    setSelectedOrder(null);
  }, []);

  const handleBackToProfile = useCallback(() => {
    setMode('profile');
    setSelectedOrder(null);
  }, []);

  const handleEditAddress = useCallback(() => {
    setMode('address-form');
  }, []);

  const handleDeleteAccount = useCallback(() => {
    setMode('delete-account');
  }, []);

  if (mode === 'edit-personal-info') {
    return (
      <EditPersonalInfoPage
        profile={profile}
        onUpdate={update}
        onBack={handleBackToProfile}
        onSignOut={handleSignOut}
        onDeleteAccount={handleDeleteAccount}
      />
    );
  }

  if (mode === 'address-form') {
    return (
      <ShippingAddressForm
        address={address}
        onSave={saveAddress}
        onRemove={removeAddress}
        onCancel={handleBackToProfile}
      />
    );
  }

  if (mode === 'orders') {
    return (
      <OrderListPage
        orders={getOrders()}
        onBack={handleBackToProfile}
        onSelectOrder={handleSelectOrder}
        selectedOrder={selectedOrder}
      />
    );
  }

  if (mode === 'app-settings') {
    return (
      <div className="profile-page" data-testid="app-settings-page">
        <div className="profile-header">
          <button className="profile-back" onClick={handleBackToProfile} aria-label="Back">
            ←
          </button>
          <h1>App Settings</h1>
        </div>
        <div className="state-message" style={{ marginTop: 40 }}>App settings are not available in the Web preview.</div>
      </div>
    );
  }

  if (mode === 'order-detail' && selectedOrder) {
    return <OrderDetailsPage order={selectedOrder} onBack={handleBackToOrders} />;
  }

  if (mode === 'delete-account') {
    return (
      <DeleteAccountPage
        onBack={handleBackToProfile}
        onDelete={() => {
          deleteAccount();
          onSignOut();
        }}
      />
    );
  }

  return (
    <div className="profile-page" data-testid="profile-page">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="profile-menu">
          <button
            type="button"
            data-testid="profile-menu-button"
            className="profile-menu-button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <SignOutIcon width={22} height={22} />
          </button>
          {menuOpen && (
            <div className="profile-menu-dropdown" role="menu">
              <button
                type="button"
                role="menuitem"
                data-testid="sign-out-option"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <main className="profile-scroll">
        <section className="personal-info-section" style={{ background: TAB_BG }}>
          <div className="personal-info-content">
            <button
              type="button"
              className="edit-personal-info-button"
              data-testid="edit-personal-info-button"
              aria-label="Edit personal information"
              onClick={handleEditProfile}
            >
              <PencilIcon width={20} height={20} />
            </button>
            <p className="profile-name" style={{ color: PRIMARY }}>
              {`${profile.firstName} ${profile.lastName}`.toUpperCase()}
            </p>
            <p className="profile-email" style={{ color: PRIMARY }}>{profile.email}</p>
          </div>
        </section>

        <section className="shipping-address-section" style={{ background: SECONDARY_BG }}>
          <div className="shipping-address-header">
            <span className="section-title" style={{ color: PRIMARY }}>MY SHIPPING ADDRESS</span>
            <button
              type="button"
              className="address-action-button"
              data-testid="edit-address-button"
              aria-label={address ? 'Edit shipping address' : 'Add shipping address'}
              onClick={handleEditAddress}
              style={{ color: ACCENT }}
            >
              {address ? (
                <PencilIcon width={20} height={20} />
              ) : (
                <PlusCircleIcon width={20} height={20} />
              )}
            </button>
          </div>
          <div className="shipping-address-card-wrapper">
            <div className="shipping-address-card">
              {address ? (
                <div className="shipping-address-text" style={{ color: PRIMARY }}>
                  <p>{address.streetNumber} {address.streetName}</p>
                  <p>{address.postalCode} {address.town}</p>
                  <p>{address.country.toUpperCase()}</p>
                </div>
              ) : (
                <div className="shipping-address-placeholder">
                  <div className="shipping-address-circle">
                    <ShippingBoxIcon width={50} height={50} style={{ color: SECONDARY_LABEL }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <hr className="profile-divider" />

        <button
          type="button"
          className="profile-row-button"
          data-testid="orders-section-button"
          onClick={handleShowOrders}
        >
          <span className="section-title" style={{ color: PRIMARY }}>MY ORDERS</span>
          <ChevronRightIcon width={20} height={20} style={{ color: SECONDARY_LABEL }} />
        </button>

        <hr className="profile-divider" />

        <button
          type="button"
          className="profile-row-button"
          data-testid="app-settings-section-button"
          onClick={handleShowAppSettings}
        >
          <span className="section-title" style={{ color: PRIMARY }}>APP SETTINGS</span>
          <ChevronRightIcon width={20} height={20} style={{ color: SECONDARY_LABEL }} />
        </button>

        <hr className="profile-divider" />
      </main>
    </div>
  );
}

interface ShippingAddressFormProps {
  address: ShippingAddress | null;
  onSave: (address: ShippingAddress) => void;
  onRemove: () => void;
  onCancel: () => void;
}

function ShippingAddressForm({ address, onSave, onRemove, onCancel }: ShippingAddressFormProps) {
  const [fields, setFields] = useState({
    streetNumber: address?.streetNumber ?? '',
    streetName: address?.streetName ?? '',
    postalCode: address?.postalCode ?? '',
    town: address?.town ?? '',
    country: address?.country ?? '',
  });

  const handleChange = (key: keyof typeof fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({
      id: address?.id ?? 'addr-1',
      ...fields,
    });
    onCancel();
  };

  const handleRemove = () => {
    onRemove();
    onCancel();
  };

  const labels: { key: keyof typeof fields; label: string }[] = [
    { key: 'streetNumber', label: 'Street Number' },
    { key: 'streetName', label: 'Street Name' },
    { key: 'postalCode', label: 'Postal Code' },
    { key: 'town', label: 'Town' },
    { key: 'country', label: 'Country' },
  ];

  return (
    <div className="profile-page" data-testid="shipping-address-form">
      <div className="profile-header">
        <button className="profile-header-action" onClick={onCancel} style={{ color: ACCENT }}>
          Cancel
        </button>
        <h1>{address ? 'Edit shipping address' : 'Add shipping address'}</h1>
        <button className="profile-header-action" onClick={handleSave} style={{ color: ACCENT }}>
          Save
        </button>
      </div>

      <main className="profile-scroll">
        {labels.map(({ key, label }) => (
          <div key={key} className="address-field">
            <label style={{ color: PRIMARY }}>{label}</label>
            <input
              type="text"
              value={fields[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder="Add information"
              aria-label={label}
            />
            <hr className="profile-divider" />
          </div>
        ))}

        {address && (
          <button
            type="button"
            className="remove-address-button"
            data-testid="remove-address-button"
            onClick={handleRemove}
          >
            Remove shipping address
          </button>
        )}
      </main>
    </div>
  );
}
