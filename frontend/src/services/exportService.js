import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import config from '../config';

const API_URL = config.apiUrl;

export async function exportProject(nodes, edges) {
  try {
    const zip = new JSZip();
    
    // Ajouter le scénario
    const scenario = {
      nodes,
      edges,
      version: '1.0',
      created: new Date().toISOString(),
    };
    zip.file('scenario.json', JSON.stringify(scenario, null, 2));

    // Récupérer les médias
    const mediaFiles = nodes
      .filter(node => node.type === 'videoNode' && node.data.videoUrl)
      .map(node => node.data.videoUrl);

    for (const mediaUrl of mediaFiles) {
      try {
        const filename = mediaUrl.split('/').pop();
        const response = await fetch(`${API_URL}${mediaUrl}`);
        if (!response.ok) throw new Error(`Erreur lors de la récupération de ${filename}`);
        const blob = await response.blob();
        zip.file(`media/${filename}`, blob);
      } catch (error) {
        console.error('Erreur lors de la récupération du média:', error);
      }
    }

    // Générer le zip
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // Sauvegarder
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(content, `project-${timestamp}.pov`);

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw error;
  }
}

export const exportProjectWithMedia = async (project) => {
  const { nodes, edges } = project;
  return exportProject(nodes, edges);
};

export async function importProject(file) {
  try {
    console.log('Début de l\'import du projet:', file.name);
    
    // Lire le zip
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    console.log('Fichier .pov chargé, contenu:', Object.keys(content.files));

    // Extraire le scénario
    const scenarioFile = content.file('scenario.json');
    if (!scenarioFile) {
      throw new Error('Le fichier scenario.json est manquant dans le projet');
    }
    
    const scenarioJson = await scenarioFile.async('string');
    const scenario = JSON.parse(scenarioJson);
    console.log('Scénario chargé:', scenario);

    // Uploader les médias
    const mediaFiles = Object.keys(content.files)
      .filter(path => path.startsWith('media/') && !path.endsWith('/'));
    console.log('Médias trouvés:', ['scenario.json', ...mediaFiles]);

    // Upload scenario.json first
    const scenarioBlob = new Blob([scenarioJson], { type: 'application/json' });
    const scenarioFormData = new FormData();
    scenarioFormData.append('file', scenarioBlob, 'scenario.json');
    console.log('Upload du média: scenario.json');
    await fetch(`${API_URL}/api/media/upload`, {
      method: 'POST',
      body: scenarioFormData,
    });

    // Uploader chaque média
    for (const mediaPath of mediaFiles) {
      try {
        const mediaBlob = await content.file(mediaPath).async('blob');
        const formData = new FormData();
        const filename = mediaPath.split('/').pop();
        formData.append('file', mediaBlob, filename);

        console.log('Upload du média:', filename);
        const response = await fetch(`${API_URL}/api/media/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Erreur lors de l'upload de ${filename}`);
        }

        const result = await response.json();
        console.log('Média uploadé avec succès:', result?.file?.path);

        // Mettre à jour les chemins dans le scénario
        if (result?.file?.path) {
          scenario.nodes = scenario.nodes.map(node => {
            if (node.type === 'videoNode' && node.data.videoUrl.includes(filename)) {
              return {
                ...node,
                data: {
                  ...node.data,
                  videoUrl: result.file.path,
                },
              };
            }
            return node;
          });
        }
      } catch (error) {
        console.error(`Erreur lors de l'upload de ${mediaPath}:`, error);
      }
    }

    console.log('Import terminé avec succès');
    return {
      nodes: scenario.nodes,
      edges: scenario.edges,
    };
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    throw error;
  }
}
