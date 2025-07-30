'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8 lg:py-12">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm lg:text-base xl:text-lg">
            © 2025 Color Palette Generator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
