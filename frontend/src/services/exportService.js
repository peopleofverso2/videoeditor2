import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const API_URL = 'http://localhost:4000';

// Fonction utilitaire pour logger les erreurs avec plus de détails
function logError(message, error) {
  console.error(message, {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
    details: error
  });
}

export async function exportProject(nodes, edges) {
  try {
    console.log('Début de l\'export du projet');
    const zip = new JSZip();
    
    // Ajouter le scénario
    const scenario = {
      nodes,
      edges,
      version: '1.0',
      created: new Date().toISOString(),
    };

    console.log('Création du fichier scenario.json');
    zip.file('scenario.json', JSON.stringify(scenario, null, 2));

    // Récupérer les médias
    const mediaFiles = nodes
      .filter(node => node.type === 'videoNode' && node.data.videoUrl)
      .map(node => node.data.videoUrl);

    console.log('Médias à exporter:', mediaFiles);

    // Créer le dossier media
    const mediaFolder = zip.folder('media');

    for (const mediaUrl of mediaFiles) {
      try {
        const filename = mediaUrl.split('/').pop();
        console.log('Récupération du média:', filename);
        
        const response = await fetch(`${API_URL}${mediaUrl}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        
        const blob = await response.blob();
        mediaFolder.file(filename, blob);
        console.log('Média ajouté au zip:', filename);
      } catch (error) {
        logError('Erreur lors de la récupération du média:', error);
      }
    }

    console.log('Génération du fichier zip');
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      comment: 'Project Orchestrator Video file',
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `project-${timestamp}.pov`;
    console.log('Sauvegarde du fichier:', filename);
    
    saveAs(content, filename);
    console.log('Export terminé avec succès');
    
    return true;
  } catch (error) {
    logError('Erreur lors de l\'export:', error);
    throw error;
  }
}

export async function importProject(file) {
  try {
    if (!file) {
      throw new Error('Aucun fichier sélectionné');
    }

    console.log('Début import:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Vérifier l'extension du fichier
    if (!file.name.toLowerCase().endsWith('.pov')) {
      throw new Error('Le fichier doit avoir l\'extension .pov');
    }

    // Lire le fichier comme ArrayBuffer d'abord
    const fileBuffer = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsArrayBuffer(file);
    });

    console.log('Fichier lu comme ArrayBuffer:', {
      byteLength: fileBuffer.byteLength
    });

    // Charger le ZIP
    const zip = await JSZip.loadAsync(fileBuffer, {
      createFolders: true,
      checkCRC32: true
    });
    
    console.log('Contenu du ZIP:', Object.keys(zip.files));

    // Lire le scénario
    const scenarioFile = zip.file('scenario.json');
    if (!scenarioFile) {
      throw new Error('Le fichier scenario.json est manquant dans le projet');
    }

    const scenarioJson = await scenarioFile.async('string');
    let scenario;
    try {
      scenario = JSON.parse(scenarioJson);
    } catch (e) {
      throw new Error('Le fichier scenario.json est corrompu');
    }

    if (!scenario.nodes || !Array.isArray(scenario.nodes) || !scenario.edges || !Array.isArray(scenario.edges)) {
      throw new Error('Structure du scénario invalide');
    }

    // Upload des médias
    for (const node of scenario.nodes) {
      if (node.type === 'videoNode' && node.data.videoUrl) {
        const filename = node.data.videoUrl.split('/').pop();
        const mediaFile = zip.file(`media/${filename}`);
        
        if (mediaFile) {
          console.log('Upload du média:', filename);
          const mediaBlob = await mediaFile.async('blob');
          const formData = new FormData();
          formData.append('file', mediaBlob, filename);

          const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur upload:', errorText);
            throw new Error(`Erreur lors de l'upload de ${filename}: ${errorText}`);
          }

          const { path } = await response.json();
          node.data.videoUrl = path;
          console.log('Média uploadé:', filename, '=>', path);
        }
      }
    }

    return {
      nodes: scenario.nodes,
      edges: scenario.edges,
    };
  } catch (error) {
    console.error('Erreur détaillée:', error);
    throw error;
  }
}

// Alias pour la compatibilité
export const exportToPOVWithMedia = exportProject;
export const exportProjectWithMedia = exportProject;
export const importProjectFromZip = importProject;

export {
  exportProject,
  importProject
};
