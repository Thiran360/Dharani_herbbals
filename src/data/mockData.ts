import { Product } from '../store/useCartStore';

export const BRANDS = [
  { id: '1', name: 'MAKIL' },
  { id: '2', name: 'RAMCARE' },
  { id: '3', name: 'DIVYAM' },
  { id: '4', name: 'VANA ARASI' },
  { id: '5', name: 'DHARANI AMUTHU' },
  { id: '6', name: 'DHARANI' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Herbal Hair Oil',
    price: 499,
    image: 'https://via.placeholder.com/150',
    category: 'Hair Care',
    brand: 'RAMCARE',
    description: 'Nourishing herbal hair oil for strong and healthy hair.',
  },
  {
    id: 'p2',
    name: 'Aloe Vera Face Wash',
    price: 299,
    image: 'https://via.placeholder.com/150',
    category: 'Skin Care',
    brand: 'DIVYAM',
    description: 'Gentle face wash for glowing skin.',
  },
  {
    id: 'p3',
    name: 'Ayurvedic Soap',
    price: 150,
    image: 'https://via.placeholder.com/150',
    category: 'Bath & Body',
    brand: 'VANA ARASI',
    description: 'Handmade organic soap.',
  },
  {
    id: 'p4',
    name: 'Immunity Booster Drops',
    price: 899,
    image: 'https://via.placeholder.com/150',
    category: 'Health',
    brand: 'MAKIL',
    description: 'Natural drops to build immunity.',
  },
  {
    id: 'p5',
    name: 'Tulsi Green Tea',
    price: 350,
    image: 'https://via.placeholder.com/150',
    category: 'Health',
    brand: 'DHARANI AMUTHU',
    description: 'Refreshing and healthy green tea.',
  },
  {
    id: 'p6',
    name: 'Herbal Face Pack',
    price: 450,
    image: 'https://via.placeholder.com/150',
    category: 'Skin Care',
    brand: 'DHARANI',
    description: 'Face pack for natural glow.',
  },
];
