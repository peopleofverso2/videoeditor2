const validateProject = (project) => {
  if (!project || typeof project !== 'object') {
    throw new Error('Format de projet invalide');
  }

  if (!Array.isArray(project.nodes) || !Array.isArray(project.edges)) {
    throw new Error('Le projet doit contenir des nodes et des edges');
  }

  return true;
};

const getVideoFile = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], 'video.mp4', { type: 'video/mp4' });
  } catch (error) {
    console.error('Error getting video file:', error);
    return null;
  }
};

const createBlobUrl = (base64Data) => {
  try {
    const byteString = atob(base64Data.split(',')[1]);
    const mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error creating blob URL:', error);
    return null;
  }
};

export const createPOVFile = async (nodes, edges, startNodeId) => {
  try {
    // Convertir les vidéos en File objects
    const processedNodes = await Promise.all(nodes.map(async node => {
      if (node.type === 'videoNode' && node.data.isLocal && node.data.videoUrl) {
        const videoFile = await getVideoFile(node.data.videoUrl);
        if (videoFile) {
          return {
            ...node,
            data: {
              ...node.data,
              videoFile: {
                name: videoFile.name,
                type: videoFile.type,
                size: videoFile.size,
                data: await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(videoFile);
                })
              },
              videoUrl: null
            }
          };
        }
      }
      return node;
    }));

    const project = {
      version: "1.0",
      nodes: processedNodes,
      edges,
      startNodeId
    };

    const json = JSON.stringify(project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.pov';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error in createPOVFile:', error);
    throw error;
  }
};

export const loadPOVFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const project = JSON.parse(e.target.result);
        
        // Convertir les données vidéo en URLs
        const processedNodes = project.nodes.map(node => {
          if (node.type === 'videoNode' && node.data.videoFile) {
            // Créer un blob à partir des données base64
            const byteString = atob(node.data.videoFile.data.split(',')[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            
            const blob = new Blob([ab], { type: node.data.videoFile.type });
            const url = URL.createObjectURL(blob);
            
            return {
              ...node,
              data: {
                ...node.data,
                videoUrl: url,
                videoFile: null,
                isLocal: true
              }
            };
          }
          return node;
        });

        resolve({
          ...project,
          nodes: processedNodes
        });
      } catch (error) {
        console.error('Error in loadPOVFile:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};
