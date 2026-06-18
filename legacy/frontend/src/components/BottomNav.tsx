import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Swords, User } from 'lucide-react';
import useNavStore from '../store/useNavStore';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setProfileVisible } = useNavStore();

  const isMatchesActive = location.pathname.startsWith('/tournaments');

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[999] flex border-t border-gray-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        onClick={() => navigate('/tournaments')}
        className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-black tracking-wide transition-colors active:opacity-70 ${
          isMatchesActive
            ? 'text-primary'
            : 'text-gray-400 dark:text-neutral-600 hover:text-gray-700 dark:hover:text-neutral-400'
        }`}
      >
        <Swords size={20} />
        <span>比赛</span>
        {isMatchesActive && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 block h-0.5 w-8 rounded-full bg-primary" />
        )}
      </button>

      <button
        onClick={() => setProfileVisible(true)}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-black tracking-wide text-gray-400 dark:text-neutral-600 transition-colors hover:text-gray-700 dark:hover:text-neutral-400 active:opacity-70"
      >
        <User size={20} />
        <span>我的</span>
      </button>
    </nav>
  );
};

export default BottomNav;
