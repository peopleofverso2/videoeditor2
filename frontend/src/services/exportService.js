export const exportProjectWithMedia = async (projectData) => {
  try {
    // Logique d'export à implémenter
    console.log('Exporting project:', projectData);
    return { success: true };
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};
