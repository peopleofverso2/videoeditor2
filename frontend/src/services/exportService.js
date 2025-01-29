import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const API_URL = 'http://localhost:4000';

export async function exportProject(nodes, edges) {
  try {
    // 1. Créer un nouveau ZIP
    const zip = new JSZip();
    
    // 2. Ajouter le scénario (nodes et edges)
    const scenario = {
      nodes,
      edges,
      version: '1.0',
      created: new Date().toISOString(),
    };
    zip.file('scenario.json', JSON.stringify(scenario, null, 2));

    // 3. Récupérer et ajouter les médias
    const mediaFiles = nodes
      .filter(node => node.type === 'videoNode' && node.data.videoUrl)
      .map(node => node.data.videoUrl);

    for (const mediaUrl of mediaFiles) {
      const filename = mediaUrl.split('/').pop();
      const response = await fetch(`${API_URL}${mediaUrl}`);
      const blob = await response.blob();
      zip.file(`media/${filename}`, blob);
    }

    // 4. Générer le fichier .pov
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });

    // 5. Sauvegarder le fichier
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(content, `project-${timestamp}.pov`);

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw error;
  }
}

export async function importProject(file) {
  try {
    // 1. Lire le fichier .pov
    const zip = new JSZip();
    const content = await zip.loadAsync(file);

    // 2. Extraire le scénario
    const scenarioJson = await content.file('scenario.json').async('string');
    const scenario = JSON.parse(scenarioJson);

    // 3. Uploader les médias
    const mediaFolder = content.folder('media');
    if (mediaFolder) {
      const mediaFiles = Object.keys(mediaFolder.files)
        .filter(path => !path.endsWith('/'));

      for (const mediaPath of mediaFiles) {
        const mediaBlob = await content.file(mediaPath).async('blob');
        const formData = new FormData();
        formData.append('file', mediaBlob, mediaPath.split('/').pop());

        const response = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Erreur lors de l'upload de ${mediaPath}`);
        }

        const { path } = await response.json();

        // Mettre à jour les chemins dans le scénario
        scenario.nodes = scenario.nodes.map(node => {
          if (node.type === 'videoNode' && node.data.videoUrl.includes(mediaPath.split('/').pop())) {
            return {
              ...node,
              data: {
                ...node.data,
                videoUrl: path,
              },
            };
          }
          return node;
        });
      }
    }

    return {
      nodes: scenario.nodes,
      edges: scenario.edges,
    };
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    throw error;
  }
}
