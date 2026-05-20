import { getRarityFilterLabel } from '@/lib/rarity-display';
import { CardItem, SealedProduct } from './items-data';

export type Category = {
  id: string;
  name: string;
  checked: boolean;
  type: 'product' | 'psa_grade' | 'sealed_type' | 'series' | 'set' | 'rarity' | 'energy' | 'sealed_series' | 'extra';
  image?: string | null;
  parentSeriesId?: string;
  parentSetId?: string;
  /** DB string for tooltips when `name` is an abbreviated rarity label */
  displayFullName?: string;
};

export const initialCategories: Category[] = [
  // Product Type Selection (mutually exclusive)
  { id: 'all', name: 'All', checked: true, type: 'product' },
  { id: 'cards', name: 'Cards', checked: false, type: 'product' },
  { id: 'sealed', name: 'Sealed Products', checked: false, type: 'product' },

  // Default "All" options for each category type
  { id: 'AllPSA', name: 'All Grades', checked: true, type: 'psa_grade' },
  { id: 'AllSealed', name: 'All', checked: true, type: 'sealed_type' },
  { id: 'AllSeries', name: 'All', checked: true, type: 'series' },
  { id: 'AllEnergy', name: 'All', checked: true, type: 'energy' },
  { id: 'AllSealedSeries', name: 'All', checked: true, type: 'sealed_series' },
  { id: 'AllExtra', name: 'All', checked: true, type: 'extra' },
];

// Function to dynamically add categories based on actual data
export const addDynamicCategories = (categories: Category[], items: (CardItem | SealedProduct)[]): Category[] => {
  const newCategories = [...categories];
  
  // Separate cards and sealed products
  const cardItems = items.filter(item => item.type === 'card') as CardItem[];
  const sealedItems = items.filter(item => item.type === 'sealed') as SealedProduct[];
  
  // === CARDS LOGIC (keep existing complex series→set→rarity structure) ===
  
  // Create mapping of series to sets to rarities for cards
  const cardSeriesSetRarityMap: { [series: string]: { [set: string]: string[] } } = {};
  
  cardItems.forEach(item => {
    const series = item.series;
    const set = item.set;
    const rarity = item.rarity;
    
    if (series && set && rarity && series.trim() !== '' && set.trim() !== '' && rarity.trim() !== '') {
      if (!cardSeriesSetRarityMap[series]) {
        cardSeriesSetRarityMap[series] = {};
      }
      if (!cardSeriesSetRarityMap[series][set]) {
        cardSeriesSetRarityMap[series][set] = [];
      }
      if (!cardSeriesSetRarityMap[series][set].includes(rarity)) {
        cardSeriesSetRarityMap[series][set].push(rarity);
      }
    }
  });
  
  // Add card series
  Object.keys(cardSeriesSetRarityMap).forEach((series: string) => {
    if (!newCategories.find(cat => cat.id === series && cat.type === 'series')) {
      newCategories.push({ id: series, name: series, checked: false, type: 'series' });
    }
  });
  
  // Add card sets (nested under series)
  Object.keys(cardSeriesSetRarityMap).forEach(series => {
    Object.keys(cardSeriesSetRarityMap[series]).forEach(set => {
      const setId = `${series}:${set}`;
      if (!newCategories.find(cat => cat.id === setId && cat.type === 'set')) {
        newCategories.push({ 
          id: setId, 
          name: set, 
          checked: false, 
          type: 'set',
          parentSeriesId: series
        });
        
        // Add "All Rarities" option for this set
        newCategories.push({ 
          id: `${setId}:AllRarities`, 
          name: 'All Rarities', 
          checked: true, 
          type: 'rarity',
          parentSeriesId: series,
          parentSetId: setId
        });
      }
    });
  });
  
  // Add card rarities (nested under sets)
  Object.keys(cardSeriesSetRarityMap).forEach(series => {
    Object.keys(cardSeriesSetRarityMap[series]).forEach(set => {
      const setId = `${series}:${set}`;
      
      cardSeriesSetRarityMap[series][set].forEach((rarity: string) => {
        const rarityId = `${series}:${set}:${rarity}`;
        if (!newCategories.find(cat => cat.id === rarityId && cat.type === 'rarity')) {
          const label = getRarityFilterLabel(rarity);
          newCategories.push({ 
            id: rarityId, 
            name: label, 
            displayFullName: label !== rarity ? rarity : undefined,
            checked: false, 
            type: 'rarity',
            parentSeriesId: series,
            parentSetId: setId
          });
        }
      });
    });
  });
  
  // Add card PSA grades
  const uniquePSAGrades = [...new Set(cardItems.map(item => item.psa_grade).filter(Boolean))];
  
  uniquePSAGrades.forEach(psaGrade => {
    if (!newCategories.find(cat => cat.id === psaGrade && cat.type === 'psa_grade')) {
      newCategories.push({ id: psaGrade, name: psaGrade, checked: false, type: 'psa_grade' });
    }
  });
  
  // Add card energy types with images
  const uniqueEnergyTypes = [...new Set(cardItems.map(item => item.energy_type).filter(Boolean))];
  
  uniqueEnergyTypes.forEach(energyType => {
    if (energyType && energyType !== 'None' && !newCategories.find(cat => cat.id === energyType && cat.type === 'energy')) {
      let image: string | null = null;
      switch (energyType) {
        case 'Fire': image = '/fire.png'; break;
        case 'Water': image = '/water.png'; break;
        case 'Grass': image = '/grass.png'; break;
        case 'Colorless': image = '/colorless.png'; break;
        case 'Lightning': image = '/lightning.png'; break;
        case 'Psychic': image = '/psychic.png'; break;
        case 'Fighting': image = '/fighting.png'; break;
        case 'Dragon': image = '/dragon.png'; break;
        case 'Darkness': image = '/darkness.png'; break;
        case 'Metal': image = '/metal.png'; break;
        case 'Fairy': image = '/fairy.png'; break;
        default: image = null;
      }
      newCategories.push({ 
        id: energyType, 
        name: energyType, 
        checked: false, 
        type: 'energy',
        image: image
      });
    }
  });

  // Add card other rarities (extra categories)
  const allOtherRarities = new Set<string>();
  cardItems.forEach(item => {
    if (item.other_rarities && Array.isArray(item.other_rarities)) {
      item.other_rarities.forEach(rarity => {
        if (rarity && rarity.trim() !== '') {
          allOtherRarities.add(rarity);
        }
      });
    }
  });
  
  allOtherRarities.forEach(otherRarity => {
    if (!newCategories.find(cat => cat.id === otherRarity && cat.type === 'extra')) {
      const label = getRarityFilterLabel(otherRarity);
      newCategories.push({ 
        id: otherRarity, 
        name: label, 
        displayFullName: label !== otherRarity ? otherRarity : undefined,
        checked: false, 
        type: 'extra'
      });
    }
  });
  
  // === SEALED PRODUCTS LOGIC (simple, only sealed_series and product_type) ===
  
  // Add sealed product types
  const uniqueProductTypes = [...new Set(sealedItems.map(item => item.product_type).filter(Boolean))];
  
  uniqueProductTypes.forEach(productType => {
    if (!newCategories.find(cat => cat.id === productType && cat.type === 'sealed_type')) {
      newCategories.push({ id: productType, name: productType, checked: false, type: 'sealed_type' });
    }
  });
  
  // Add sealed product series
  const uniqueSealedSeries = [...new Set(sealedItems.map(item => item.sealed_series).filter(Boolean))];
  
  uniqueSealedSeries.forEach(sealedSeries => {
    // Make sealed series IDs unique by prefixing with "sealed_"
    const sealedSeriesId = `sealed_${sealedSeries}`;
    if (!newCategories.find(cat => cat.id === sealedSeriesId && cat.type === 'sealed_series')) {
      newCategories.push({ id: sealedSeriesId, name: sealedSeries, checked: false, type: 'sealed_series' });
    }
  });
  
  return newCategories;
};

// Simple function to get the "All" option ID for a category type
const getAllOptionId = (categoryType: string): string | null => {
  switch (categoryType) {
    case 'psa_grade': return 'AllPSA';
    case 'sealed_type': return 'AllSealed';
    case 'series': return 'AllSeries';
    case 'energy': return 'AllEnergy';
    case 'sealed_series': return 'AllSealedSeries';
    case 'extra': return 'AllExtra';
    default: return null;
  }
};

// Function to check if we should auto-reset to "All Series" when all card series are selected
const shouldAutoResetToAllSeries = (categories: Category[]): boolean => {
  // Get all card series (excluding "All Series") - IMPORTANT: NOT sealed_series
  const allCardSeries = categories.filter(cat => 
    cat.type === 'series' && 
    cat.id !== 'AllSeries'
  );
  
  // Only reset if there's at least 1 card series
  if (allCardSeries.length === 0) return false;
  
  // Check if ALL card series are checked
  const activeCardSeries = allCardSeries.filter(series => series.checked);
  
  // Check if ALL sets in ALL card series are checked
  const allCardSets = categories.filter(cat => cat.type === 'set' && 
    allCardSeries.some(series => series.id === cat.parentSeriesId)
  );
  const activeCardSets = allCardSets.filter(set => set.checked);
  
  // Check if ALL green circles (All Rarities) are active for card series
  const allGreenCircles = categories.filter(cat => 
    cat.type === 'rarity' && 
    cat.id.includes(':AllRarities') &&
    allCardSeries.some(series => series.id === cat.parentSeriesId)
  );
  const activeGreenCircles = allGreenCircles.filter(circle => circle.checked);
  
  // Reset when ALL card series, ALL card sets, AND ALL green circles are active
  const shouldReset = (activeCardSeries.length === allCardSeries.length && allCardSeries.length > 0 &&
                      activeCardSets.length === allCardSets.length && allCardSets.length > 0 &&
                      activeGreenCircles.length === allGreenCircles.length && allGreenCircles.length > 0);
  
  return shouldReset;
};

export const updateCategories = (currentCategories: Category[], categoryId: string): Category[] => {
  // === PRODUCT TYPE SELECTION (highest priority - mutually exclusive) ===
  if (categoryId === 'all' || categoryId === 'cards' || categoryId === 'sealed') {
    // Reset all filters when switching product types
    return currentCategories.map(cat => {
      if (cat.type === 'product') {
        // Only the selected product type is checked
        return { ...cat, checked: cat.id === categoryId };
      }
      
      // Reset all other filters to their "All" defaults
      if (cat.type === 'psa_grade') {
        return { ...cat, checked: cat.id === 'AllPSA' };
      }
      if (cat.type === 'sealed_type') {
        return { ...cat, checked: cat.id === 'AllSealed' };
      }
      if (cat.type === 'series') {
        return { ...cat, checked: cat.id === 'AllSeries' };
      }
      if (cat.type === 'energy') {
        return { ...cat, checked: cat.id === 'AllEnergy' };
      }
      if (cat.type === 'sealed_series') {
        return { ...cat, checked: cat.id === 'AllSealedSeries' };
      }
      if (cat.type === 'set' || cat.type === 'rarity') {
        return { ...cat, checked: false };
      }
      
      return cat;
    });
  }

  // === HANDLE "ALL" OPTIONS ===
  if (categoryId === 'AllPSA' || categoryId === 'AllSealed' || categoryId === 'AllSeries' || 
      categoryId === 'AllEnergy' || categoryId === 'AllSealedSeries') {
    
    return currentCategories.map(category => {
      // Get the type of the clicked "All" category
      const clickedCategoryType = currentCategories.find(cat => cat.id === categoryId)?.type;
      
      if (category.type === clickedCategoryType) {
        // Only the clicked "All" option is checked
        return { ...category, checked: category.id === categoryId };
      }
      
      // Special handling for AllSeries - also clear all sets and rarities
      if (categoryId === 'AllSeries') {
        if (category.type === 'set' || category.type === 'rarity') {
          return { ...category, checked: false };
        }
      }
      
      return category;
    });
  }

  // === CARD SERIES LOGIC (keep existing complex logic) ===
  // Only process when we're in "Cards" mode
  const currentProductMode = currentCategories.find(cat => cat.type === 'product' && cat.checked)?.id;
  const cardSeriesCategory = currentCategories.find(cat => cat.id === categoryId && cat.type === 'series');
  
  if (cardSeriesCategory && currentProductMode === 'cards') {
    const seriesId = categoryId;
    
    // Toggle the clicked series first
    let updatedCategories = currentCategories.map(cat => 
      cat.id === categoryId ? { ...cat, checked: !cat.checked } : cat
    );
    
    // Check if the series is now checked or unchecked
    const isSeriesChecked = updatedCategories.find(cat => cat.id === categoryId)?.checked;
    
    if (isSeriesChecked) {
      // Series was checked - auto-activate all children
      updatedCategories = updatedCategories.map(cat => {
        // Auto-check all sets in this series
        if (cat.type === 'set' && cat.parentSeriesId === seriesId) {
          return { ...cat, checked: true };
        }
        // Auto-check all "All Rarities" options for sets in this series (green circles)
        if (cat.type === 'rarity' && 
            cat.id.includes(':AllRarities') && 
            cat.parentSeriesId === seriesId) {
          return { ...cat, checked: true };
        }
        // Auto-deselect "All Series" since a specific series is now selected
        if (cat.id === 'AllSeries') {
          return { ...cat, checked: false };
        }
        return cat;
      });
    } else {
      // Series was unchecked - deselect all children and deactivate green circles
      updatedCategories = updatedCategories.map(cat => {
        // Uncheck all sets in this series
        if (cat.type === 'set' && cat.parentSeriesId === seriesId) {
          return { ...cat, checked: false };
        }
        // Uncheck all individual rarities in this series
        if (cat.type === 'rarity' && 
            cat.parentSeriesId === seriesId && 
            !cat.id.includes(':AllRarities')) {
          return { ...cat, checked: false };
        }
        // Deactivate green circles (All Rarities) to default state
        if (cat.type === 'rarity' && 
            cat.id.includes(':AllRarities') && 
            cat.parentSeriesId === seriesId) {
          return { ...cat, checked: false };
        }
        return cat;
      });
      
      // Check if this was the only series selected - if so, reactivate "All Series"
      const allSpecificSeries = updatedCategories.filter(cat => 
        cat.type === 'series' && 
        cat.id !== 'AllSeries'
      );
      
      const selectedSpecificSeries = allSpecificSeries.filter(cat => cat.checked);
      
      if (selectedSpecificSeries.length === 0) {
        // No specific series selected - reactivate "All Series" default
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === 'AllSeries') {
            return { ...cat, checked: true };
          }
          return cat;
        });
      }
    }
    
    // Check if we should auto-reset to "All Series" when all children are selected
    if (shouldAutoResetToAllSeries(updatedCategories)) {
      updatedCategories = updatedCategories.map(cat => {
        if (cat.id === 'AllSeries') {
          return { ...cat, checked: true };
        }
        // Only reset series, sets, and rarities - preserve everything else
        if (cat.type === 'series' || cat.type === 'set' || cat.type === 'rarity') {
          return { ...cat, checked: false };
        }
        return cat;
      });
    }
    
    return updatedCategories;
  }

  // === CARD SET LOGIC (keep existing complex logic) ===
  // Only process when we're in "Cards" mode
  if (categoryId.includes(':') && !categoryId.includes('AllRarities') && currentProductMode === 'cards') {
    const parts = categoryId.split(':');
    if (parts.length === 2) {
      const [seriesId] = parts;
      const setId = categoryId;
      
      // Toggle the clicked set first
      let updatedCategories = currentCategories.map(cat => 
        cat.id === categoryId ? { ...cat, checked: !cat.checked } : cat
      );
      
      // Check if the set is now checked or unchecked
      const isSetChecked = updatedCategories.find(cat => cat.id === categoryId)?.checked;
      
      if (isSetChecked) {
        // Set was checked - auto-check the parent series
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === seriesId) {
            return { ...cat, checked: true };
          }
          return cat;
        });
        
        // Auto-deselect "All Series" since a specific series is now selected
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === 'AllSeries') {
            return { ...cat, checked: false };
          }
          return cat;
        });
        
        // Auto-check the "All Rarities" option for this set (green circle)
        const allRaritiesId = `${setId}:AllRarities`;
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === allRaritiesId) {
            return { ...cat, checked: true };
          }
          return cat;
        });
      } else {
        // Set was unchecked - check if no other sets in this series are selected
        const otherSetsInSeries = updatedCategories.filter(cat => 
          cat.type === 'set' && 
          cat.parentSeriesId === seriesId && 
          cat.id !== setId
        );
        
        const otherSetsSelected = otherSetsInSeries.filter(set => set.checked);
        
        // If no other sets are selected, deselect the parent series
        if (otherSetsSelected.length === 0) {
          updatedCategories = updatedCategories.map(cat => {
            if (cat.id === seriesId) {
              return { ...cat, checked: false };
            }
            return cat;
          });
          
          // Check if this was the only series with selected sets - if so, reactivate "All Series"
          const allSeries = updatedCategories.filter(cat => 
            cat.type === 'series' && 
            cat.id !== 'AllSeries'
          );
          
          const seriesWithSelectedSets = allSeries.filter(series => {
            const setsInThisSeries = updatedCategories.filter(cat => 
              cat.type === 'set' && 
              cat.parentSeriesId === series.id
            );
            return setsInThisSeries.some(set => set.checked);
          });
          
          if (seriesWithSelectedSets.length === 0) {
            // No series have selected sets - reactivate "All Series" and clear all rarities
            updatedCategories = updatedCategories.map(cat => {
              if (cat.id === 'AllSeries') {
                return { ...cat, checked: true };
              }
              // Clear all rarities when going back to "All Series"
              if (cat.type === 'rarity') {
                return { ...cat, checked: false };
              }
              return cat;
            });
          }
        }
      }
      
      // Check if we should auto-reset to "All Series" when all children are selected
      if (shouldAutoResetToAllSeries(updatedCategories)) {
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === 'AllSeries') {
            return { ...cat, checked: true };
          }
          // Only reset series, sets, and rarities - preserve everything else
          if (cat.type === 'series' || cat.type === 'set' || cat.type === 'rarity') {
            return { ...cat, checked: false };
          }
          return cat;
        });
      }
      
      return updatedCategories;
    }
  }

  // === CARD RARITY LOGIC (keep existing complex logic) ===
  // Only process when we're in "Cards" mode
  if (categoryId.includes(':') && !categoryId.includes('AllRarities') && currentProductMode === 'cards') {
    const parts = categoryId.split(':');
    if (parts.length === 3) {
      const [seriesId, setName] = parts;
      const setId = `${seriesId}:${setName}`;
      const allRaritiesId = `${setId}:AllRarities`;
      
      // Toggle the clicked rarity first
      let updatedCategories = currentCategories.map(cat => 
        cat.id === categoryId ? { ...cat, checked: !cat.checked } : cat
      );
      
      // Auto-check the parent set when a rarity is selected
      updatedCategories = updatedCategories.map(cat => {
        if (cat.id === setId) {
          return { ...cat, checked: true };
        }
        return cat;
      });
      
      // Auto-check the parent series when a rarity is selected
      updatedCategories = updatedCategories.map(cat => {
        if (cat.id === seriesId) {
          return { ...cat, checked: true };
        }
        return cat;
      });
      
      // Auto-deselect "All Series" since a specific series is now selected
      updatedCategories = updatedCategories.map(cat => {
        if (cat.id === 'AllSeries') {
          return { ...cat, checked: false };
        }
        return cat;
      });
      
      // Handle "All Rarities" logic for this set
      const allSpecificRaritiesInSet = updatedCategories.filter(cat => 
        cat.type === 'rarity' && 
        cat.parentSetId === setId && 
        !cat.id.includes(':AllRarities')
      );
      
      const selectedSpecificRaritiesInSet = allSpecificRaritiesInSet.filter(cat => cat.checked);
      
      // If all specific rarities are selected, auto-check "All Rarities" and deselect individuals
      if (allSpecificRaritiesInSet.length > 0 && selectedSpecificRaritiesInSet.length === allSpecificRaritiesInSet.length) {
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === allRaritiesId) {
            return { ...cat, checked: true };
          }
          if (cat.type === 'rarity' && cat.parentSetId === setId && !cat.id.includes(':AllRarities')) {
            return { ...cat, checked: false };
          }
          return cat;
        });
      }
      // If no specific rarities are selected, auto-check "All Rarities"
      else if (selectedSpecificRaritiesInSet.length === 0) {
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === allRaritiesId) {
            return { ...cat, checked: true };
          }
          return cat;
        });
      }
      // If some (but not all) specific rarities are selected, deselect "All Rarities"
      else {
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === allRaritiesId) {
            return { ...cat, checked: false };
          }
          return cat;
        });
      }
      
      // Check if we should reactivate "All Series" when no series have active sets
      const allSeries = updatedCategories.filter(cat => 
        cat.type === 'series' && 
        cat.id !== 'AllSeries'
      );
      
      const seriesWithActiveSets = allSeries.filter(series => {
        const setsInThisSeries = updatedCategories.filter(cat => 
          cat.type === 'set' && 
          cat.parentSeriesId === series.id
        );
        return setsInThisSeries.some(set => set.checked);
      });
      
      if (seriesWithActiveSets.length === 0) {
        // No series have active sets - reactivate "All Series"
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === 'AllSeries') {
            return { ...cat, checked: true };
          }
          return cat;
        });
      }
      
      // Check if we should auto-reset to "All Series" when all children are selected
      if (shouldAutoResetToAllSeries(updatedCategories)) {
        updatedCategories = updatedCategories.map(cat => {
          if (cat.id === 'AllSeries') {
            return { ...cat, checked: true };
          }
          // Only reset series, sets, and rarities - preserve everything else
          if (cat.type === 'series' || cat.type === 'set' || cat.type === 'rarity') {
            return { ...cat, checked: false };
          }
          return cat;
        });
      }
      
      return updatedCategories;
    }
  }

  // === "ALL EXTRA" HANDLER (Other Rarities All button) ===
  if (categoryId === 'AllExtra') {
    const isAllExtraChecked = currentCategories.find(cat => cat.id === 'AllExtra')?.checked;
    
    const updatedCategories = currentCategories.map(cat => {
      if (cat.id === 'AllExtra') {
        // Toggle the AllExtra button
        return { ...cat, checked: !isAllExtraChecked };
      }
      if (cat.type === 'extra' && cat.id !== 'AllExtra') {
        // When AllExtra is selected, deselect all individual options
        // When AllExtra is deselected, keep individual options as they are
        return { ...cat, checked: false };
      }
      return cat;
    });
    
    return updatedCategories;
  }

  // === "ALL RARITIES" HANDLER (green circle clicks) ===
  // Only process when we're in "Cards" mode
  if (categoryId.includes(':AllRarities') && currentProductMode === 'cards') {
    const [seriesId, setName] = categoryId.split(':AllRarities')[0].split(':');
    const setId = `${seriesId}:${setName}`;
    
    let updatedCategories = currentCategories.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, checked: true };
      }
      if (cat.type === 'rarity' && cat.parentSetId === setId && cat.id !== categoryId) {
        return { ...cat, checked: false };
      }
      return cat;
    });
    
    // Check if we should auto-reset to "All Series" when all children are selected
    if (shouldAutoResetToAllSeries(updatedCategories)) {
      updatedCategories = updatedCategories.map(cat => {
        if (cat.id === 'AllSeries') {
          return { ...cat, checked: true };
        }
        // Only reset series, sets, and rarities - preserve everything else
        if (cat.type === 'series' || cat.type === 'set' || cat.type === 'rarity') {
          return { ...cat, checked: false };
        }
        return cat;
      });
    }
    
    return updatedCategories;
  }

  // === SIMPLE CATEGORY HANDLERS (everything else) ===
  
  // Find the category by ID and type
  const clickedCategory = currentCategories.find(cat => cat.id === categoryId);
  
  if (clickedCategory) {
    const clickedCategoryType = clickedCategory.type;
    
    // First, update the clicked category
    let updatedCategories = currentCategories.map(category => {
      if (category.type === clickedCategoryType) {
        // Toggle the clicked category
        if (category.id === categoryId) {
          return { ...category, checked: !category.checked };
        }
        
        // Keep other categories of the same type unchanged
        return category;
      }
      return category;
    });
    
    // Second pass: if we're checking a specific option, automatically deselect the corresponding "All" option
    const isCheckingSpecificOption = updatedCategories.find(cat => cat.id === categoryId)?.checked;
    if (isCheckingSpecificOption) {
      const allOptionId = getAllOptionId(clickedCategoryType);
      if (allOptionId) {
        updatedCategories = updatedCategories.map(cat => 
          cat.id === allOptionId ? { ...cat, checked: false } : cat
        );
      }
    }
    
    // Third pass: if we're unchecking a specific option and no others are selected, reactivate "All"
    if (!isCheckingSpecificOption) {
      const allSpecificOptions = updatedCategories.filter(cat => 
        cat.type === clickedCategoryType && 
        cat.id !== getAllOptionId(clickedCategoryType)
      );
      
      const selectedSpecificOptions = allSpecificOptions.filter(cat => cat.checked);
      
      if (selectedSpecificOptions.length === 0) {
        const allOptionId = getAllOptionId(clickedCategoryType);
        if (allOptionId) {
          updatedCategories = updatedCategories.map(cat => 
            cat.id === allOptionId ? { ...cat, checked: true } : cat
          );
        }
      }
    }
    
    // Fourth pass: check if we should auto-reset to "All" when all specific options are selected
    if (isCheckingSpecificOption) {
      const allSpecificOptions = updatedCategories.filter(cat => 
        cat.type === clickedCategoryType && 
        cat.id !== getAllOptionId(clickedCategoryType)
      );
      
      const selectedSpecificOptions = allSpecificOptions.filter(cat => cat.checked);
      
      // If ALL specific options are selected, auto-check "All" and deselect individuals
      if (allSpecificOptions.length > 0 && selectedSpecificOptions.length === allSpecificOptions.length) {
        const allOptionId = getAllOptionId(clickedCategoryType);
        if (allOptionId) {
          updatedCategories = updatedCategories.map(cat => {
            if (cat.id === allOptionId) {
              return { ...cat, checked: true };
            }
            if (cat.type === clickedCategoryType && cat.id !== allOptionId) {
              return { ...cat, checked: false };
            }
            return cat;
          });
        }
      }
    }
    
    return updatedCategories;
  }
  
  return currentCategories;
};

export const ensureDefaultSelection = (categories: Category[]): Category[] => {
  // Get the current product type selection
  const selectedProductType = categories.find(cat => cat.type === 'product' && cat.checked);
  
  const result = categories.map(cat => {
    // Only set defaults for the currently selected product type
    if (selectedProductType?.id === 'cards') {
      // Card defaults
      if (cat.type === 'psa_grade' && !categories.some(c => c.type === 'psa_grade' && c.checked && c.id !== 'AllPSA')) {
        return { ...cat, checked: cat.id === 'AllPSA' };
      }
      if (cat.type === 'series' && !categories.some(c => c.type === 'series' && c.checked && c.id !== 'AllSeries')) {
        return { ...cat, checked: cat.id === 'AllSeries' };
      }
      if (cat.type === 'energy' && !categories.some(c => c.type === 'energy' && c.checked && c.id !== 'AllEnergy')) {
        return { ...cat, checked: cat.id === 'AllEnergy' };
      }
    } else if (selectedProductType?.id === 'sealed') {
      // Sealed product defaults
      if (cat.type === 'sealed_type' && !categories.some(c => c.type === 'sealed_type' && c.checked && c.id !== 'AllSealed')) {
        return { ...cat, checked: cat.id === 'AllSealed' };
      }
      if (cat.type === 'sealed_series' && !categories.some(c => c.type === 'sealed_series' && c.checked && c.id !== 'AllSealedSeries')) {
        return { ...cat, checked: cat.id === 'AllSealedSeries' };
      }
    } else {
      // "All" product type - set all defaults
      if (cat.type === 'psa_grade' && !categories.some(c => c.type === 'psa_grade' && c.checked && c.id !== 'AllPSA')) {
        return { ...cat, checked: cat.id === 'AllPSA' };
      }
      if (cat.type === 'sealed_type' && !categories.some(c => c.type === 'sealed_type' && c.checked && c.id !== 'AllSealed')) {
        return { ...cat, checked: cat.id === 'AllSealed' };
      }
      if (cat.type === 'series' && !categories.some(c => c.type === 'series' && c.checked && c.id !== 'AllSeries')) {
        return { ...cat, checked: cat.id === 'AllSeries' };
      }
      if (cat.type === 'energy' && !categories.some(c => c.type === 'energy' && c.checked && c.id !== 'AllEnergy')) {
        return { ...cat, checked: cat.id === 'AllEnergy' };
      }
      if (cat.type === 'sealed_series' && !categories.some(c => c.type === 'sealed_series' && c.checked && c.id !== 'AllSealedSeries')) {
        return { ...cat, checked: cat.id === 'AllSealedSeries' };
      }
    }
    
    return cat;
  });
  
  return result;
};

 