
import React from 'react';
import { Role } from '../types';
import { QrCodeIcon } from './Icons';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

const Header: React.FC<HeaderProps> = ({ currentRole, onRoleChange }) => {
  const isGuard = currentRole === Role.GUARD;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center">
        <QrCodeIcon className="w-8 h-8 text-indigo-500 mr-3" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Swift-Pass</h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className={`font-semibold ${isGuard ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>Guard</span>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!isGuard}
            onChange={() => onRoleChange(isGuard ? Role.WARDEN : Role.GUARD)}
            className="sr-only peer"
          />
          <div className="relative w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
        <span className={`font-semibold ${!isGuard ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>Warden</span>
      </div>
    </header>
  );
};

export default Header;
