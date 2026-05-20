import React from 'react';
import Image from 'next/image';
import logo from '../../../public/Ponchos-Pokemon.png';

export default function Header() {
  return (
    <header className="w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-700 p-6 py-4 md:py-10 rounded-t-lg shadow-md shadow-black items-center justify-center">
        <div className="w-8/10 md:w-6/10 m-auto">
          <Image 
            src={logo} 
            alt="Ponchos-puchamon" 
            className="object-contain m-auto"
            priority
          />
        </div>
    </header>
  );
} 