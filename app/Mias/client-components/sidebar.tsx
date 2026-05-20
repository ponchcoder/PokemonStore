'use client'

import React from 'react';
import { Category } from './ssr/category-functions';

interface SidebarProps {
  categories: Category[];
  onCategoryChange: (categoryId: string) => void;
}

export default function Sidebar({ categories, onCategoryChange }: SidebarProps) {
  return (
    <div className="w-full md:w-44 lg:w-44 bg-gradient-to-br from-teal-900 via-teal-800 to-teal-500 text-white my-4 rounded-lg p-4 md:p-4 shadow-lg shadow-teal-900">
      <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Categories:</h2>
      <div className="flex flex-wrap gap-2 md:flex-col md:space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center bg-teal-800/50 rounded-lg px-2 py-1 md:bg-transparent md:px-0 md:py-0">
            <input
              type="checkbox"
              id={category.id}
              checked={category.checked}
              onChange={() => onCategoryChange(category.id)}
              className="w-4 h-4 md:w-5 md:h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor={category.id} className="ml-2 md:ml-3 text-sm md:text-base font-medium">
              {category.name}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
} 