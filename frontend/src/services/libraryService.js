// Clés pour le stockage local
const LIBRARY_STATE_KEY = 'mediaLibraryState';

// État par défaut
const defaultState = {
  sortBy: 'name',
  sortOrder: 'asc',
  selectedTags: [],
};

// Charger l'état depuis le stockage local
export const loadLibraryState = () => {
  try {
    const savedState = localStorage.getItem(LIBRARY_STATE_KEY);
    return savedState ? JSON.parse(savedState) : defaultState;
  } catch (error) {
    console.error('Erreur lors du chargement de l\'état de la bibliothèque:', error);
    return defaultState;
  }
};

// Sauvegarder l'état dans le stockage local
export const saveLibraryState = (state) => {
  try {
    localStorage.setItem(LIBRARY_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'état de la bibliothèque:', error);
  }
};
