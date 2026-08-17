import { useCallback, useState } from 'react';
import type { Profile } from '../../services/profileService';
import { updatePassword as requestPasswordUpdate, requestEmailUpdate } from '../../services/profileService';
import {
  CheckmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  KeyIcon,
  PersonIcon,
  PhoneIcon,
  SignOutIcon,
  XMarkIcon,
} from './Icons';

const PRIMARY = '#2F2440';
const ACCENT = '#710117';
const SECONDARY_LABEL = '#8E8E93';
const GREEN = '#2E7D32';

interface EditPersonalInfoPageProps {
  profile: Profile;
  onUpdate: (next: Partial<Profile>) => void;
  onBack: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

type UpdateSection = 'none' | 'email' | 'password';

export function EditPersonalInfoPage({
  profile,
  onUpdate,
  onBack,
  onSignOut,
  onDeleteAccount,
}: EditPersonalInfoPageProps) {
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [updateSection, setUpdateSection] = useState<UpdateSection>('none');
  const [emailState, setEmailState] = useState({
    newEmail: '',
    currentPassword: '',
    requested: false,
    updated: false,
  });
  const [passwordState, setPasswordState] = useState({
    newPassword: '',
    updated: false,
  });
  const [error, setError] = useState('');

  const handleFieldChange = useCallback(
    (field: 'firstName' | 'lastName' | 'phoneNumber', value: string) => {
      if (field === 'firstName') setFirstName(value);
      if (field === 'lastName') setLastName(value);
      if (field === 'phoneNumber') setPhoneNumber(value);
      onUpdate({ [field]: value });
    },
    [onUpdate]
  );

  const handleRequestEmail = useCallback(() => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailState.newEmail)) {
      setError('Please enter a valid email');
      return;
    }
    if (emailState.currentPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setEmailState((s) => ({ ...s, currentPassword: '' }));
      return;
    }
    if (emailState.newEmail === profile.email) {
      setError('Email is the same as current email');
      return;
    }
    requestEmailUpdate(emailState.newEmail, emailState.currentPassword);
    setEmailState((s) => ({ ...s, requested: true }));
    setError('');
  }, [emailState, profile.email]);

  const handleUpdatePassword = useCallback(() => {
    requestPasswordUpdate(passwordState.newPassword);
    setPasswordState((s) => ({ ...s, updated: true }));
  }, [passwordState.newPassword]);

  return (
    <div className="profile-page" data-testid="edit-personal-info-page">
      <div className="profile-header">
        <button className="profile-back" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon width={22} height={22} />
        </button>
        <h1>Personal Information</h1>
      </div>

      <main className="profile-scroll">
        {error && (
          <div className="profile-error" role="alert">
            {error}
          </div>
        )}

        <LabeledField
          icon={<PersonIcon width={20} height={20} style={{ color: ACCENT }} />}
          label="First Name"
          value={firstName}
          onChange={(value) => handleFieldChange('firstName', value)}
        />
        <hr className="profile-divider" />

        <LabeledField
          icon={<PersonIcon width={20} height={20} style={{ color: ACCENT }} />}
          label="Last Name"
          value={lastName}
          onChange={(value) => handleFieldChange('lastName', value)}
        />
        <hr className="profile-divider" />

        <LabeledField
          icon={<PhoneIcon width={20} height={20} style={{ color: ACCENT }} />}
          label="Phone Number"
          value={phoneNumber}
          onChange={(value) => handleFieldChange('phoneNumber', value)}
        />
        <hr className="profile-divider" />

        <div className="labeled-readonly">
          <span className="labeled-readonly-label" style={{ color: SECONDARY_LABEL }}>Email</span>
          <div className="labeled-readonly-row">
            <EnvelopeIcon width={20} height={20} style={{ color: ACCENT }} />
            <span style={{ color: SECONDARY_LABEL }}>{profile.email}</span>
          </div>
        </div>
        <hr className="profile-divider" />

        <EditEmailSection
          active={updateSection === 'email'}
          onOpen={() => setUpdateSection('email')}
          onClose={() => setUpdateSection('none')}
          newEmail={emailState.newEmail}
          currentPassword={emailState.currentPassword}
          requested={emailState.requested}
          updated={emailState.updated}
          onNewEmailChange={(newEmail) => setEmailState((s) => ({ ...s, newEmail }))}
          onPasswordChange={(currentPassword) => setEmailState((s) => ({ ...s, currentPassword }))}
          onRequest={handleRequestEmail}
        />

        <EditPasswordSection
          active={updateSection === 'password'}
          onOpen={() => setUpdateSection('password')}
          onClose={() => setUpdateSection('none')}
          newPassword={passwordState.newPassword}
          updated={passwordState.updated}
          onChange={(newPassword) => setPasswordState({ newPassword, updated: false })}
          onSave={handleUpdatePassword}
        />

        <div className="sign-out-button-section">
          <div className="labeled-row">
            <SignOutIcon width={20} height={20} style={{ color: ACCENT }} />
            <button
              type="button"
              className="black-action-button"
              data-testid="edit-page-sign-out"
              onClick={onSignOut}
            >
              Sign Out
            </button>
          </div>
          <hr className="profile-divider" />
        </div>

        <button
          type="button"
          className="delete-account-section"
          data-testid="delete-account-section"
          onClick={onDeleteAccount}
        >
          <XMarkIcon width={20} height={20} style={{ color: ACCENT }} />
          <span className="delete-account-button">
            <span>DELETE ACCOUNT</span>
            <ChevronRightIcon width={18} height={18} style={{ color: '#fff' }} />
          </span>
        </button>
      </main>
    </div>
  );
}

interface LabeledFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function LabeledField({ icon, label, value, onChange }: LabeledFieldProps) {
  return (
    <div className="labeled-field">
      <span className="labeled-field-label" style={{ color: SECONDARY_LABEL }}>{label}</span>
      <div className="labeled-row">
        {icon}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ color: PRIMARY }}
        />
      </div>
    </div>
  );
}

interface EditEmailSectionProps {
  active: boolean;
  onOpen: () => void;
  onClose: () => void;
  newEmail: string;
  currentPassword: string;
  requested: boolean;
  updated: boolean;
  onNewEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRequest: () => void;
}

function EditEmailSection({
  active,
  onOpen,
  requested,
  updated,
  newEmail,
  currentPassword,
  onNewEmailChange,
  onPasswordChange,
  onRequest,
}: EditEmailSectionProps) {
  if (!active) {
    return (
      <div className="edit-toggle-section">
        <button type="button" className="edit-toggle-button" onClick={onOpen}>
          Change email
        </button>
        <hr className="profile-divider" />
      </div>
    );
  }

  if (!requested) {
    return (
      <div className="edit-toggle-section">
        <div className="labeled-field">
          <span className="labeled-field-label" style={{ color: SECONDARY_LABEL }}>New Email</span>
          <div className="labeled-row">
            <EnvelopeIcon width={20} height={20} style={{ color: ACCENT }} />
            <input
              type="email"
              placeholder="Enter a new valid email"
              value={newEmail}
              onChange={(e) => onNewEmailChange(e.target.value)}
              style={{ color: PRIMARY }}
            />
          </div>
        </div>
        <div className="labeled-field">
          <span className="labeled-field-label" style={{ color: SECONDARY_LABEL }}>Current Password</span>
          <div className="labeled-row">
            <KeyIcon width={20} height={20} style={{ color: ACCENT }} />
            <input
              type="password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              style={{ color: PRIMARY }}
            />
          </div>
        </div>
        <button type="button" className="edit-toggle-button" onClick={onRequest}>
          Request update
        </button>
        <hr className="profile-divider" />
      </div>
    );
  }

  return (
    <div className="edit-toggle-section">
      <div className="success-row">
        <CheckmarkIcon width={20} height={20} style={{ color: GREEN }} />
        <span style={{ color: PRIMARY }}>
          {updated
            ? 'Email has been changed'
            : `Request sent to ${newEmail}. Click on the link received to proceed with update.`}
        </span>
      </div>
      <hr className="profile-divider" />
    </div>
  );
}

interface EditPasswordSectionProps {
  active: boolean;
  onOpen: () => void;
  onClose: () => void;
  newPassword: string;
  updated: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
}

function EditPasswordSection({
  active,
  onOpen,
  updated,
  newPassword,
  onChange,
  onSave,
}: EditPasswordSectionProps) {
  if (!active) {
    return (
      <div className="edit-toggle-section">
        <button type="button" className="edit-toggle-button" onClick={onOpen}>
          Change password
        </button>
        <hr className="profile-divider" />
      </div>
    );
  }

  if (!updated) {
    return (
      <div className="edit-toggle-section">
        <div className="labeled-field">
          <span className="labeled-field-label" style={{ color: SECONDARY_LABEL }}>New Password</span>
          <div className="labeled-row">
            <KeyIcon width={20} height={20} style={{ color: ACCENT }} />
            <input
              type="password"
              placeholder="Enter a new password"
              value={newPassword}
              onChange={(e) => onChange(e.target.value)}
              style={{ color: PRIMARY }}
            />
          </div>
        </div>
        <button type="button" className="edit-toggle-button" onClick={onSave}>
          Save
        </button>
        <hr className="profile-divider" />
      </div>
    );
  }

  return (
    <div className="edit-toggle-section">
      <div className="success-row">
        <CheckmarkIcon width={20} height={20} style={{ color: GREEN }} />
        <span style={{ color: PRIMARY }}>Password has been changed</span>
      </div>
      <hr className="profile-divider" />
    </div>
  );
}

interface DeleteAccountPageProps {
  onBack: () => void;
  onDelete: () => void;
}

export function DeleteAccountPage({ onBack, onDelete }: DeleteAccountPageProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="profile-page" data-testid="delete-account-page">
      <div className="profile-header">
        <button className="profile-back" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon width={22} height={22} />
        </button>
        <h1>Delete Account</h1>
      </div>

      <main className="profile-scroll">
        <p className="delete-account-text" style={{ color: PRIMARY }}>
          Click below if you want to delete your account. This will permanently remove your account
          from our systems.
          <br /><br />
          This action being sensitive, please consider signing out and signing in again to be able
          to proceed.
        </p>

        <button
          type="button"
          className="black-action-button"
          data-testid="delete-account-button"
          onClick={() => setShowConfirm(true)}
        >
          Delete my account
        </button>

        {showConfirm && (
          <div className="confirm-dialog" role="dialog" aria-modal="true">
            <div className="confirm-dialog-content">
              <h3>Are you sure you want to delete your account?</h3>
              <p>This action is permanent.</p>
              <div className="confirm-dialog-actions">
                <button type="button" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={onDelete}
                  data-testid="confirm-delete-button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
