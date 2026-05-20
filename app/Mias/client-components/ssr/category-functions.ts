export type Category = {
  id: string;
  name: string;
  checked: boolean;
};

export const initialCategories: Category[] = [
  { id: 'all', name: 'All', checked: true },
  { id: 'headwear', name: 'Headwear', checked: false },
  { id: 'tops', name: 'Tops', checked: false },
  { id: 'shorts', name: 'Shorts', checked: false },
  { id: 'stuffed-toys', name: 'Stuffed toys', checked: false },
  { id: 'accesories', name: 'Accesories', checked: false },
  { id: 'sets', name: 'Sets', checked: false },
  { id: 'swimwear', name: 'Swimwear', checked: false },
  { id: 'patterns', name: 'Patterns', checked: false },
  { id: 'flowers', name: 'Flowers', checked: false },
  { id: 'other', name: 'Other', checked: false },
];

export const updateCategories = (currentCategories: Category[], categoryId: string): Category[] => {
  return currentCategories.map(category => {
    if (categoryId === 'all') {
      return {
        ...category,
        checked: category.id === 'all'
      };
    } else {
      if (category.id === 'all') {
        return { ...category, checked: false };
      }
      return {
        ...category,
        checked: category.id === categoryId ? !category.checked : category.checked
      };
    }
  });
};

export const ensureDefaultSelection = (categories: Category[]): Category[] => {
  const hasSelectedCategories = categories.some(cat => cat.checked && cat.id !== 'all');
  if (!hasSelectedCategories) {
    return categories.map(cat => ({
      ...cat,
      checked: cat.id === 'all'
    }));
  }
  return categories;
};

export const getSelectedCategoryNames = (categories: Category[]): string[] => {
  const selectedCategories = categories.filter(cat => cat.checked);
  if (selectedCategories.some(cat => cat.id === 'all')) {
    return categories.filter(cat => cat.id !== 'all').map(cat => cat.name);
  }
  return selectedCategories.map(cat => cat.name);
}; 