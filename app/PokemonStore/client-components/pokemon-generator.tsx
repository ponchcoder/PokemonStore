'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { StaticImageData } from 'next/image';
import charmander from '../../../public/charmanderstarter.png';
import bulbasaur from '../../../public/bulbasaurstarter.png';
import squirtle from '../../../public/squirtlestarter.png';
import { Button } from '@/components/ui/button';

type StarterPokemon = {
  name: string;
  image: StaticImageData;
};

const STARTER_POKEMON: StarterPokemon[] = [
  { name: 'Charmander', image: charmander },
  { name: 'Bulbasaur', image: bulbasaur },
  { name: 'Squirtle', image: squirtle }
];

type GeneratorState = 'idle' | 'shaking' | 'opening' | 'reveal';

const SHAKE_DURATION_MS = 3000;
const OPEN_DURATION_MS = 1000;

export function PokemonGenerator() {
  const [selectedPokemon, setSelectedPokemon] = useState<StarterPokemon | null>(null);
  const [generatorState, setGeneratorState] = useState<GeneratorState>('idle');
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(window.clearTimeout);
    };
  }, []);

  const generatePokemon = () => {
    timersRef.current.forEach(window.clearTimeout);

    const randomIndex = Math.floor(Math.random() * STARTER_POKEMON.length);
    setSelectedPokemon(STARTER_POKEMON[randomIndex]);
    setGeneratorState('shaking');

    const openTimer = window.setTimeout(() => {
      setGeneratorState('opening');
    }, SHAKE_DURATION_MS);

    const revealTimer = window.setTimeout(() => {
      setGeneratorState('reveal');
    }, SHAKE_DURATION_MS + OPEN_DURATION_MS);

    timersRef.current = [openTimer, revealTimer];
  };

  const isAnimating = generatorState === 'shaking' || generatorState === 'opening';
  const isRevealed = generatorState === 'reveal';

  return (
    <>
      {generatorState === 'opening' && (
        <div className="fixed inset-0 bg-stone-200 animate-flash z-50"></div>
      )}

      <div className="flex h-[310px] flex-col items-center">
        <h2 className="mb-8 h-8 text-center text-2xl font-bold text-white">
          {selectedPokemon ? 'Your Shopping Buddy is...' : 'Choose Your Shopping Buddy'}
        </h2>
        
        <div className="relative my-2 h-32 w-32 flex-none">
          <div
            className={`pokeball ${generatorState} w-full h-full relative transition-opacity duration-500 ${
              generatorState === 'opening' || isRevealed ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-red-600 rounded-t-full"></div>
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white rounded-b-full"></div>
              <div className="absolute top-1/2 left-0 w-full h-4 bg-black -translate-y-2"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white rounded-full -translate-x-4 -translate-y-4 border-4 border-black"></div>
            </div>
          </div>

          {selectedPokemon && (
            <div className={`absolute inset-0 ${isRevealed ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
              <div className="relative h-full w-full p-2">
                <Image
                  src={selectedPokemon.image}
                  alt={selectedPokemon.name}
                  fill
                  priority
                  quality={100}
                  className="object-contain p-2"
                  loading="eager"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 h-7 flex-none">
          <h3
            className={`text-xl font-semibold text-white ${
              isRevealed && selectedPokemon ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
          >
            {selectedPokemon ? `${selectedPokemon.name}!` : 'Shopping Buddy'}
          </h3>
        </div>

        <Button
          onClick={generatePokemon}
          disabled={isAnimating}
          className={`mt-8 h-12 min-w-36 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-500 ${
            isAnimating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {selectedPokemon ? 'Regenerate' : 'Generate'}
        </Button>
      </div>
    </>
  );
} 