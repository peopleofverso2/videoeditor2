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
    if (!file || !(file instanceof File)) {
      throw new Error('Paramètre invalide: le fichier est manquant ou invalide');
    }

    console.log('Début de l\'import du projet:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    // Vérifier l'extension du fichier
    if (!file.name.toLowerCase().endsWith('.pov')) {
      throw new Error('Le fichier doit avoir l\'extension .pov');
    }

    // Lire le fichier
    console.log('Lecture du fichier...');
    const zip = new JSZip();
    
    try {
      await zip.loadAsync(file, {
        createFolders: true
      });
    } catch (error) {
      logError('Erreur lors de la lecture du zip:', error);
      throw new Error('Impossible de lire le fichier .pov. Vérifiez que le fichier n\'est pas corrompu.');
    }

    // Vérifier la structure du zip
    const files = Object.keys(zip.files);
    console.log('Contenu du zip:', files);

    // Vérifier et lire scenario.json
    const scenarioFile = zip.file('scenario.json');
    if (!scenarioFile) {
      throw new Error('Le fichier .pov est invalide: scenario.json est manquant');
    }

    let scenario;
    try {
      const scenarioJson = await scenarioFile.async('string');
      scenario = JSON.parse(scenarioJson);
      console.log('Scénario chargé:', {
        nodesCount: scenario.nodes?.length,
        edgesCount: scenario.edges?.length,
        version: scenario.version
      });
    } catch (error) {
      logError('Erreur lors de la lecture du scénario:', error);
      throw new Error('Le fichier scenario.json est invalide ou corrompu');
    }

    // Valider la structure du scénario
    if (!scenario.nodes || !Array.isArray(scenario.nodes) || 
        !scenario.edges || !Array.isArray(scenario.edges)) {
      throw new Error('Le scénario est invalide: structure incorrecte');
    }

    // Gérer les médias
    const mediaFiles = Object.keys(zip.files).filter(path => 
      path.startsWith('media/') && !path.endsWith('/')
    );
    
    console.log('Médias trouvés:', mediaFiles);

    // Upload des médias en parallèle
    const mediaResults = await Promise.all(
      mediaFiles.map(async (path) => {
        const filename = path.split('/').pop();
        try {
          console.log('Traitement du média:', filename);
          const mediaBlob = await zip.file(path).async('blob');
          
          const formData = new FormData();
          formData.append('file', mediaBlob, filename);

          console.log('Upload du média:', filename);
          const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
          }

          const { path: uploadedPath } = await response.json();
          console.log('Média uploadé:', filename, '=>', uploadedPath);
          return { filename, uploadedPath };
        } catch (error) {
          logError(`Erreur lors de l'upload de ${filename}:`, error);
          return { filename, error };
        }
      })
    );

    // Mise à jour des chemins dans le scénario
    scenario.nodes = scenario.nodes.map(node => {
      if (node.type === 'videoNode' && node.data.videoUrl) {
        const filename = node.data.videoUrl.split('/').pop();
        const mediaResult = mediaResults.find(r => r.filename === filename);
        
        if (mediaResult?.uploadedPath) {
          console.log('Mise à jour du chemin pour:', filename, '=>', mediaResult.uploadedPath);
          return {
            ...node,
            data: {
              ...node.data,
              videoUrl: mediaResult.uploadedPath,
            },
          };
        } else if (mediaResult?.error) {
          console.warn(`Le média ${filename} n'a pas pu être uploadé:`, mediaResult.error);
        }
      }
      return node;
    });

    console.log('Import terminé avec succès');
    return {
      nodes: scenario.nodes,
      edges: scenario.edges,
    };
  } catch (error) {
    // Assurons-nous que l'erreur a un message
    const errorMessage = error?.message || 'Une erreur inconnue est survenue';
    logError('Erreur lors de l\'import:', error);
    throw new Error(errorMessage);
  }
}
