import { saveAs } from 'file-saver';
import JSZip from 'jszip';

// Helper function to download a file from a URL
async function fetchFile(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return blob;
}

// Helper function to generate a unique filename
function generateUniqueFilename(originalUrl, nodeId) {
  const extension = originalUrl.split('.').pop().toLowerCase();
  return `video_${nodeId}.${extension}`;
}

// Convertir les coordonnées pour POV-Ray
const convertCoordinates = (pos) => {
  return {
    x: pos.x / 100,
    y: -pos.y / 100,
    z: 0
  };
};

// Générer le contenu POV pour un nœud vidéo
const generateVideoNodePOV = (node, videoFilename) => {
  const pos = convertCoordinates(node.position);
  return `
// Nœud vidéo: ${node.data.label || 'Sans titre'}
#declare Video_${node.id} = object {
  box {
    <-1, -0.5625, -0.001>, <1, 0.5625, 0.001>
    texture {
      pigment {
        image_map {
          mp4 "media/${videoFilename}"
          once
        }
      }
    }
  }
  translate <${pos.x}, ${pos.y}, ${pos.z}>
}

object { Video_${node.id} }
`;
};

// Générer les transitions entre les nœuds
const generateTransitionPOV = (edge, nodes) => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  if (!sourceNode || !targetNode) return '';
  
  const sourcePos = convertCoordinates(sourceNode.position);
  const targetPos = convertCoordinates(targetNode.position);
  
  return `
// Transition entre ${sourceNode.data.label || 'Source'} et ${targetNode.data.label || 'Cible'}
cylinder {
  <${sourcePos.x}, ${sourcePos.y}, ${sourcePos.z}>,
  <${targetPos.x}, ${targetPos.y}, ${targetPos.z}>,
  0.02
  texture {
    pigment { color rgb<0.2, 0.4, 1> }
    finish { phong 0.7 }
  }
}
`;
};

// Générer la configuration de la caméra
const generateCameraPOV = (nodes) => {
  // Calculer le centre de la scène
  const center = nodes.reduce((acc, node) => ({
    x: acc.x + node.position.x,
    y: acc.y + node.position.y
  }), { x: 0, y: 0 });
  
  center.x /= nodes.length * 100;
  center.y /= -nodes.length * 100;
  
  return `
camera {
  location <${center.x}, ${center.y}, -5>
  look_at <${center.x}, ${center.y}, 0>
  angle 60
}

light_source {
  <${center.x}, ${center.y}, -5>
  color rgb<1, 1, 1>
  parallel
  point_at <${center.x}, ${center.y}, 0>
}

light_source {
  <-10, 10, -5>
  color rgb<0.5, 0.5, 0.5>
}
`;
};

// Générer l'en-tête du fichier POV
const generatePOVHeader = () => `
#version 3.7;
global_settings { 
  assumed_gamma 1.0 
  ambient_light rgb<0.2, 0.2, 0.2>
}

#include "colors.inc"
#include "textures.inc"
#include "glass.inc"

background { color rgb<0.05, 0.05, 0.05> }
`;

// Export principal en POV avec médias
export const exportToPOVWithMedia = async (nodes, edges) => {
  try {
    const zip = new JSZip();
    const mediaFolder = zip.folder('media');
    const mediaFiles = {};
    let povContent = generatePOVHeader();
    
    // Télécharger et ajouter tous les fichiers vidéo
    for (const node of nodes) {
      if ((node.type === 'videoNode' || node.type === 'videoInteractiveNode') && node.data?.videoUrl) {
        try {
          console.log('Traitement du nœud vidéo:', node.id, node.data.videoUrl);
          const videoBlob = await fetchFile(node.data.videoUrl);
          const filename = generateUniqueFilename(node.data.videoUrl, node.id);
          mediaFiles[node.id] = filename;
          mediaFolder.file(filename, videoBlob);
        } catch (error) {
          console.error(`Erreur lors du téléchargement de la vidéo pour le nœud ${node.id}:`, error);
        }
      }
    }
    
    // Ajouter la configuration de la caméra
    povContent += generateCameraPOV(nodes);
    
    // Ajouter les nœuds vidéo
    for (const node of nodes) {
      if ((node.type === 'videoNode' || node.type === 'videoInteractiveNode') && mediaFiles[node.id]) {
        povContent += generateVideoNodePOV(node, mediaFiles[node.id]);
      }
    }
    
    // Ajouter les transitions
    edges.forEach(edge => {
      povContent += generateTransitionPOV(edge, nodes);
    });
    
    // Créer le fichier POV
    zip.file('scene.pov', povContent);
    
    // Ajouter un README
    const readme = `# Projet Vidéo Interactif - Format POV-Ray

Ce package contient votre projet vidéo interactif exporté au format POV-Ray.

Structure du projet :
- media/ : Contient tous les fichiers vidéo utilisés dans le projet
- scene.pov : Fichier de scène POV-Ray

Pour rendre la scène :
1. Assurez-vous que POV-Ray est installé sur votre système
2. Gardez tous les fichiers dans la même structure de dossiers
3. Ouvrez scene.pov dans POV-Ray
4. Lancez le rendu

Note : Les vidéos sont référencées relativement au fichier scene.pov dans le dossier 'media/'`;
    
    zip.file('README.md', readme);
    
    // Générer le fichier zip
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });
    
    // Sauvegarder le fichier zip
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(content, `video-project-pov-${timestamp}.zip`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'export POV:', error);
    return false;
  }
};
