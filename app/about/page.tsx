import Image from 'next/image';
import gengarwallpper from '../../public/gengarwallpaper.png';

export default function About() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-black">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={gengarwallpper}
          alt="Gengar Background"
          fill
          className="object-cover opacity-60"
          priority
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-wider">
          About Me
        </h1>
        
        <div className="space-y-6 text-lg md:text-xl text-white/90 leading-relaxed">
          <p>
            Hey there, fellow Pokemon trainers! 👋
          </p>
          
          <p>
            I&apos;m just a youngster who&apos;s absolutely crazy about Pokemon! This isn&apos;t my job or anything fancy - 
            it&apos;s pure passion and love for the game that&apos;s been part of my life since I was little.
          </p>
          
          <p>
            I started collecting cards as a hobby, and honestly, I still can&apos;t believe how amazing this community is. 
            Every card tells a story, every trade brings new friends, and every battle makes us stronger together.
          </p>
          
          <p>
            My dream is simple but big: I want to help <span className="text-yellow-300 font-semibold">EVERYONE</span> become a Pokemon Master! 
            Whether you&apos;re just starting your journey or you&apos;re a seasoned collector, I&apos;m here to help.
          </p>
          
          <p>
            Through selling and trading, I hope to make rare cards accessible, help complete collections, 
            and most importantly, bring the Pokemon community closer together. Because at the end of the day, 
            we&apos;re all just kids at heart, chasing that dream of being the very best!
          </p>
          
          <p className="text-yellow-300 font-semibold text-xl md:text-2xl">
            Let&apos;s catch &apos;em all together! 🌟
          </p>
        </div>
        
        <div className="mt-12">
          <a 
            href="/PokemonStore" 
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Start Your Pokemon Journey →
          </a>
        </div>
      </div>
    </main>
  );
} 