interface TabBarProps {
  activeView: 'store' | 'favorites' | 'cart' | 'profile';
  onChange: (view: 'store' | 'favorites' | 'cart' | 'profile') => void;
}

type TabId = 'home' | 'store' | 'favorites' | 'cart' | 'profile';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'store', label: 'Store' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'cart', label: 'Cart' },
  { id: 'profile', label: 'Profile' },
];

function TabIcon({ id, active }: { id: TabId; active: boolean }) {
  const fill = active ? 'currentColor' : 'none';
  if (id === 'home') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.2 12 3l9 8.2v9.3h-6v-6h-6v6H3z" fill={fill} /></svg>;
  }
  if (id === 'store') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.2h10.7L20 7H6M9 20a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 9 20Zm8 0a1.4 1.4 0 1 0 0-2.8A1.4 1.4 0 0 0 17 20Z" fill={fill} /></svg>;
  }
  if (id === 'favorites') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" fill={fill} /></svg>;
  }
  if (id === 'cart') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 7h11l1.3 14H5.2L6.5 7ZM9 8V6a3 3 0 0 1 6 0v2" fill={fill} /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" fill={fill} /></svg>;
}

export function TabBar({ activeView, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="Main tabs">
      {tabs.map((tab) => {
        const active = activeView === tab.id;
        const supported = tab.id === 'store' || tab.id === 'favorites' || tab.id === 'cart' || tab.id === 'profile';
        return (
          <button
            key={tab.id}
            type="button"
            data-testid={`tab-${tab.id}`}
            className={active ? 'active' : ''}
            aria-pressed={active}
            aria-disabled={!supported}
            onClick={() => {
              if (tab.id === 'store' || tab.id === 'favorites' || tab.id === 'cart' || tab.id === 'profile') {
                onChange(tab.id);
              }
            }}
          >
            <span className="tab-icon"><TabIcon id={tab.id} active={active} /></span>
            {active && <span className="tab-label">{tab.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
