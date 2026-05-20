export interface CardItem {
    id: number;     
    card_id: string;
    card: string;
    series: string;
    set: string;
    energy_type: 'Fire' | 'Water' | 'Grass' | 'Colorless' | 'Lightning' | 'Psychic' | 'Fighting' | 'Dragon' | 'Darkness' | 'Metal' | 'Fairy' | 'None';
    rarity: string;
    other_rarities: string[]; // Changed to array
    psa_grade: string;
    price: number;
    imageUrl: string | null;
    additionalImages: (string | null)[];
    uploadDate: string;
    description: string;
    type: 'card';
    is_available: boolean;
    weight: number;
    quantity: number;
}

export interface SealedProduct {
    id: number;
    product_id: string;
    product_name: string;
    product_type: string;
    sealed_series: string;
    sealed_set: string;
    uploadDate: string;
    price: number;
    imageUrl: string | null;
    additionalImages: (string | null)[];
    description: string;
    packs: number;
    type: 'sealed';
    is_available: boolean;
    weight: number;
    quantity: number;
}

export type items = CardItem | SealedProduct; 