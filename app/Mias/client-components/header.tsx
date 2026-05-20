import React from 'react';

export default function Header() {
  return (
    <header className="w-full bg-gradient-to-r from-teal-800 via-teal-600 to-teal-500 p-6 py-4 md:py-10 rounded-t-lg shadow-lg shadow-teal-900">
      <div className="container mx-auto text-center flex items-center justify-center">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-pink-300 tracking-wide">
          <span className="text-9xl">𝒮</span>𝓉𝒾𝓉𝒸𝒽ℯ𝒹
        </h1>
        <h2 className="text-medium text-pink-300 ml-2">By MIMI</h2>
      </div>
    </header>
  );
} 