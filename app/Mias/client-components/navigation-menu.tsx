import Image from 'next/image';
import Yarn from '../images/yarnball.jpeg';

export function NavigationMenu() {
  const scrollToGrid = () => {
    const gridElement = document.getElementById('item-grid');
    if (gridElement) {
      gridElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-pink-100 mb-20 shadow-md shadow-black items-center flex h-16 md:h-20 lg:h-24 relative">
      <div className="flex flex-wrap pl-4 md:pl-10 pr-4 md:pr-20 py-2 w-full items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-8">
          <Image 
            src={Yarn} 
            alt="YarnBall" 
            priority
            className="logo w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 shadow-lg shadow-black rounded-lg" 
          />
          {/* Navigation Links */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4">
            <div 
              onClick={scrollToGrid} 
              className="text-gray-700 hover:text-gray-900 px-2 md:px-3 py-2 rounded-md text-lg font-medium cursor-pointer nav-link whitespace-nowrap"
            >
              Shop
            </div>
          </div>
        </div>
        <Image 
          src={Yarn} 
          alt="YarnBall" 
          priority
          className="absolute shadow-lg shadow-black rounded-full h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 animate-drop-bounce-roll" 
        />
      </div>
    </div>
  );
}
  