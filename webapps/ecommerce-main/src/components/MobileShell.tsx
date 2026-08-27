import { TabBar } from './TabBar';

interface MobileShellProps {
  children: React.ReactNode;
  showTabBar?: boolean;
}

export function MobileShell({ children, showTabBar = true }: MobileShellProps) {
  return (
    <div data-harness-app-shell className="relative w-full max-w-[402px] h-full mx-auto bg-cream overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 right-0 h-12 z-50 flex items-end justify-center pb-1 bg-cream">
        <div className="w-28 h-7 bg-black rounded-full"></div>
      </div>
      <div className={showTabBar ? 'page h-full overflow-y-auto no-scrollbar pt-12 pb-28' : 'page h-full overflow-y-auto no-scrollbar pt-12'}>
        {children}
      </div>
      {showTabBar && <div className="tab-bar"><TabBar /></div>}
    </div>
  );
}
