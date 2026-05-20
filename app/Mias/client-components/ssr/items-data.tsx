import whiteflower from '../../images/flower.jpeg';
import purpset from '../../images/purp-set.jpeg';
import whiteset from '../../images/white-set.jpeg';
import purpbeanie from '../../images/beanie.jpeg';
import yellowbee from '../../images/yellow-bee.jpg';
import blueberry from '../../images/blue-berry.jpg';
import pinkdonut from '../../images/pink-donut.jpg';
import purpdonut from '../../images/purp-donut.jpg';
import greencto from '../../images/green-squid.jpg';
import pinkbee from '../../images/pink-bee.jpg';

import { StaticImageData } from 'next/image';


export interface items {
    id: number;
    item_name: string;
    category: 'Headwear' | 'Tops' | 'Shorts' | 'Stuffed toys' | 'Accesories' | 'Sets' | 'Swimwear' | 'Patterns' | 'Flowers' | 'Other';
    size: string;
    price: number;
    imageUrl: StaticImageData;
    additionalImages: StaticImageData[];
    colors: string;
    description: string;
  }
  
  export const featuredCards: items[] = [
    { 
      id: 1,
      item_name: "Gengar Beanie", 
      category: 'Headwear',
      size: 'One Size',
      price: 49.99,
      imageUrl: purpbeanie,
      additionalImages: [purpbeanie, pinkbee, greencto],
      colors: 'Purple',
      description: 'A cozy purple beanie featuring the iconic Gengar design, perfect for keeping warm in style.'
    },
    { 
      id: 2,
      item_name: "Summer set", 
      category: 'Sets',
      size: 'M',
      price: 89.99,
      imageUrl: whiteset,
      additionalImages: [whiteset, whiteset, whiteset],
      colors: 'White',
      description: 'A complete summer outfit set in white, including top and bottom pieces for a fresh summer look.'
    },
    { 
      id: 3,
      item_name: 'Summer set', 
      category: 'Sets',
      size: 'S',
      price: 89.99,
      imageUrl: purpset,
      additionalImages: [purpset, purpset, purpset],
      colors: 'Purple',
      description: 'A complete summer outfit set in purple, including top and bottom pieces for a vibrant summer look.'
    },
    { 
      id: 4,
      item_name: 'White Flower', 
      category: 'Flowers',
      size: 'One Size',
      price: 14.99,
      imageUrl: whiteflower,
      additionalImages: [whiteflower, whiteflower, whiteflower],
      colors: 'White',
      description: 'A delicate white flower accessory, perfect for adding a touch of elegance to any outfit.'
    },
    {
      id: 5,
      item_name: 'Bumble Bee',
      category: 'Stuffed toys',
      size: 'One Size',
      price: 14.99,
      imageUrl: yellowbee,
      additionalImages: [yellowbee, yellowbee, purpbeanie],
      colors: 'Yellow',
      description: 'An adorable yellow bumble bee plush toy, soft and cuddly for all ages.'
    },
    { 
      id: 6,
      item_name: "Bumble Bee", 
      category: 'Stuffed toys',
      size: 'One Size',
      price: 14.99,
      imageUrl: pinkbee,
      additionalImages: [pinkbee, pinkbee, pinkbee],
      colors: 'Pink',
      description: 'A cute pink bumble bee plush toy, perfect for gifting or collecting.'
    },
    { 
      id: 7,
      item_name: "Bumble Bee", 
      category: 'Stuffed toys',
      size: 'One size',
      price: 19.99,
      imageUrl: purpdonut,
      additionalImages: [purpdonut, purpdonut, purpdonut],
      colors: 'Purple',
      description: 'A soft and squishy purple donut plush toy, great for decoration or play.'
    },
    { 
      id: 8,
      item_name: 'Bumble Bee', 
      category: 'Stuffed toys',
      size: 'One size',
      price: 19.99,
      imageUrl: pinkdonut,
      additionalImages: [pinkdonut, pinkdonut, pinkdonut],
      colors: 'Green',
      description: 'A soft and squishy pink donut plush toy, perfect for donut lovers.'
    },
    { 
      id: 9,
      item_name: 'Octopus', 
      category: 'Stuffed toys',
      size: 'One Size',
      price: 19.99,
      imageUrl: greencto,
      additionalImages: [greencto, greencto, greencto],
      colors: 'Green',
      description: 'A charming green octopus plush toy with soft tentacles, great for cuddling.'
    },
    {
      id: 10,
      item_name: 'Blueberry',
      category: 'Stuffed toys',
      size: 'One Size',
      price: 19.99,
      imageUrl: blueberry,
      additionalImages: [blueberry, blueberry, blueberry],
      colors: 'Blue',
      description: 'You memba the boston tea party?'
    }
  ]