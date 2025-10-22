import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-row gap-2 items-center justify-center">
          <Link to="/" className="inline-flex items-center gap-3">
            <svg className="w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="10" className="text-indigo-100" fill="currentColor" />
              <path d="M7 12l3 3 7-7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Group Travel</span>
          </Link>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-md">
              Plan group trips, track expenses and settle balances with ease. Small, privacy-friendly tool — data stays in your browser.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;