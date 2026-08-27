import { useLocation, Link } from 'react-router-dom';
import { House, ShoppingCart, Heart, ShoppingBag, User } from 'lucide-react';
import clsx from 'clsx';
import type { TabKey } from '@/types';

const tabs: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: 'home', icon: House, label: 'Home' },
  { key: 'store', icon: ShoppingCart, label: 'Store' },
  { key: 'favorites', icon: Heart, label: 'Favorites' },
  { key: 'cart', icon: ShoppingBag, label: 'Cart' },
  { key: 'profile', icon: User, label: 'Profile' },
];

const routeToTab: Record<string, TabKey> = {
  '/': 'home',
  '/store': 'store',
  '/favorites': 'favorites',
  '/cart': 'cart',
  '/profile': 'profile',
};

export function TabBar() {
  const location = useLocation();
  const active = routeToTab[location.pathname] || 'home';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 flex justify-around items-end px-2 pb-2 pt-2 bg-cream">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            to={`/${tab.key === 'home' ? '' : tab.key}`}
            data-harness-tab
            className={clsx(
              'flex flex-col items-center justify-end flex-1 pb-2 transition-all duration-200',
              isActive ? '-translate-y-2' : ''
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-center rounded-full transition-all',
                isActive ? 'w-14 h-14 -mt-4 bg-secondary shadow-md' : 'w-10 h-10'
              )}
            >
              <Icon
                className={clsx(
                  'transition-all',
                  isActive ? 'w-7 h-7 text-accent fill-current' : 'w-6 h-6 text-accent'
                )}
                strokeWidth={2}
              />
            </div>
            {isActive && (
              <span className="text-[10px] font-medium text-accent mt-0.5">{tab.label}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
