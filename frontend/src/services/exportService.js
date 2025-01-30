import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function exportProject(nodes, edges, projectName) {
  try {
    const zip = new JSZip();
    
    // Créer le fichier de scénario
    const scenario = {
      projectName,
      nodes,
      edges,
      version: '1.0',
      exportDate: new Date().toISOString()
    };

    // Ajouter le fichier de scénario au zip
    zip.file('scenario.json', JSON.stringify(scenario, null, 2));

    // Générer le fichier zip
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });

    // Sauvegarder
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(content, `${projectName || 'project'}-${timestamp}.pov`);

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw error;
  }
}

export async function importProject(file) {
  return new Promise((resolve, reject) => {
    const zip = new JSZip();
    
    zip.loadAsync(file)
      .then(async (zipContent) => {
        try {
          // Lire le fichier de scénario
          const scenarioFile = zipContent.file('scenario.json');
          if (!scenarioFile) {
            throw new Error('Format de fichier invalide');
          }
          
          const scenarioContent = await scenarioFile.async('text');
          const scenario = JSON.parse(scenarioContent);
          
          resolve({
            nodes: scenario.nodes,
            edges: scenario.edges,
            projectName: scenario.projectName
          });
        } catch (error) {
          reject(error);
        }
      })
      .catch(error => {
        reject(new Error('Erreur lors de la lecture du fichier'));
      });
  });
}
