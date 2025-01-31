import html2canvas from 'html2canvas';

export const captureFlowScreenshot = async (reactFlowWrapper) => {
  if (!reactFlowWrapper.current) return null;

  try {
    const canvas = await html2canvas(reactFlowWrapper.current, {
      backgroundColor: null,
      scale: 0.5, // Réduire la taille pour optimiser
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Erreur lors de la capture du graphe:', error);
    return null;
  }
};
