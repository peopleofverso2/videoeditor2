import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const FileManager = ({ onSave, onLoad, setNodes }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    const savedFiles = JSON.parse(localStorage.getItem('videoEditorFiles') || '[]');
    setFiles(savedFiles);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const saveFile = () => {
    const timestamp = new Date().toISOString();
    const fileData = {
      id: Date.now().toString(),
      name: newFileName,
      timestamp,
      data: onSave(),
      history: []
    };

    const updatedFiles = [...files, fileData];
    localStorage.setItem('videoEditorFiles', JSON.stringify(updatedFiles));
    setFiles(updatedFiles);
    setOpenSaveDialog(false);
    setNewFileName('');
  };

  // Fonction pour convertir un blob en base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Fonction pour convertir une URL blob en base64
  const blobUrlToBase64 = async (blobUrl) => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return await blobToBase64(blob);
    } catch (error) {
      console.error('Erreur lors de la conversion du blob:', error);
      return null;
    }
  };

  const exportToFile = async () => {
    const currentData = onSave();
    
    // Collecter et convertir les ressources
    const resources = {};
    for (const node of currentData.nodes) {
      if (node.data.imageUrl && node.data.imageUrl.startsWith('blob:')) {
        const base64 = await blobUrlToBase64(node.data.imageUrl);
        if (base64) {
          resources[node.data.imageUrl] = base64;
        }
      }
      if (node.data.videoUrl && node.data.videoUrl.startsWith('blob:')) {
        const base64 = await blobUrlToBase64(node.data.videoUrl);
        if (base64) {
          resources[node.data.videoUrl] = base64;
        }
      }
    }

    const fileData = {
      version: '1.0',
      name: newFileName || 'scenario',
      timestamp: new Date().toISOString(),
      resources,
      flow: {
        nodes: currentData.nodes,
        edges: currentData.edges
      }
    };

    const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newFileName || 'scenario'}.pov`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    handleMenuClose();
  };

  const importFromFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          console.log('Données importées brutes:', importedData);
          
          // Vérifier si les données sont dans le bon format
          let nodesToRestore = importedData.flow?.nodes;
          let edgesToRestore = importedData.flow?.edges;
          let resources = importedData.resources || {};
          
          if (!nodesToRestore || !edgesToRestore) {
            throw new Error('Format de fichier invalide');
          }

          console.log('Ressources à restaurer:', resources);
          
          // Restaurer les fonctions pour chaque nœud
          const restoredNodes = nodesToRestore.map(node => {
            // S'assurer que le type est correct
            const nodeType = node.type || 'default';
            
            // Créer des URLs blob pour les ressources base64
            const nodeResources = {};
            if (node.data.imageUrl && resources[node.data.imageUrl]) {
              const base64Data = resources[node.data.imageUrl];
              const blob = dataURLtoBlob(base64Data);
              nodeResources.imageUrl = URL.createObjectURL(blob);
            }
            if (node.data.videoUrl && resources[node.data.videoUrl]) {
              const base64Data = resources[node.data.videoUrl];
              const blob = dataURLtoBlob(base64Data);
              nodeResources.videoUrl = URL.createObjectURL(blob);
            }
            
            // Créer un nouveau nœud avec les bonnes propriétés
            const restoredNode = {
              id: node.id,
              type: nodeType,
              position: node.position || { x: 0, y: 0 },
              data: {
                ...node.data,
                ...nodeResources,
                label: node.data.label || 'Nœud sans titre',
                options: node.data.options || [],
                onChange: (newData) => {
                  setNodes((nds) => 
                    nds.map((n) => 
                      n.id === node.id 
                        ? { ...n, data: { ...n.data, ...newData } }
                        : n
                    )
                  );
                }
              }
            };
            
            console.log('Nœud restauré avec ressources:', restoredNode);
            return restoredNode;
          });

          console.log('Nœuds restaurés:', restoredNodes);
          console.log('Liens restaurés:', edgesToRestore);

          // Envoyer les données restaurées
          onLoad({
            nodes: restoredNodes,
            edges: edgesToRestore
          });
          
          // Feedback visuel
          const notification = document.createElement('div');
          notification.textContent = `Import réussi (${restoredNodes.length} nœuds, ${edgesToRestore.length} liens, ${Object.keys(resources).length} ressources)`;
          notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 47, 167, 0.98);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 9999;
          `;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        } catch (error) {
          console.error('Erreur lors de l\'import:', error);
          const errorNotification = document.createElement('div');
          errorNotification.textContent = `Erreur lors de l'import: ${error.message}`;
          errorNotification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #d32f2f;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 9999;
          `;
          document.body.appendChild(errorNotification);
          setTimeout(() => errorNotification.remove(), 3000);
        }
      };
      reader.readAsText(file);
    }
    handleMenuClose();
    event.target.value = '';
  };

  // Fonction pour convertir une dataURL en Blob
  const dataURLtoBlob = (dataURL) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const formatDate = (timestamp) => {
    return format(new Date(timestamp), "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  return (
    <>
      <Button
        onClick={handleMenuClick}
        startIcon={<AddIcon sx={{ fontSize: '1.2rem' }} />}
      >
        Fichier
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          '& .MuiPaper-root': {
            bgcolor: 'rgba(0, 47, 167, 0.98)',
            backdropFilter: 'blur(8px)',
            borderRadius: 1,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minWidth: '180px',
            mt: 0.5,
            py: 0.5
          },
          '& .MuiMenuItem-root': {
            fontSize: '0.875rem',
            py: 0.75,
            px: 1.5,
            color: 'white',
            gap: 1.5,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.2rem'
            }
          },
          '& .MuiDivider-root': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            my: 0.5
          }
        }}
      >
        <MenuItem onClick={() => {
          setOpenSaveDialog(true);
          handleMenuClose();
        }}>
          <SaveIcon /> Nouveau
        </MenuItem>
        
        <MenuItem component="label">
          <FileUploadIcon /> Importer
          <input
            type="file"
            hidden
            accept=".pov"
            onChange={importFromFile}
          />
        </MenuItem>

        <MenuItem onClick={exportToFile}>
          <FileDownloadIcon /> Exporter
        </MenuItem>

        <Divider />

        {files.map((file) => (
          <MenuItem
            key={file.id}
            onClick={() => {
              onLoad(file.data);
              handleMenuClose();
            }}
          >
            <RestoreIcon />
            {file.name}
          </MenuItem>
        ))}
      </Menu>

      <Dialog 
        open={openSaveDialog} 
        onClose={() => setOpenSaveDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 47, 167, 0.98)',
            color: 'white',
            backdropFilter: 'blur(8px)',
            borderRadius: 1,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 2,
            '& .MuiDialogTitle-root': {
              p: 0,
              pb: 2,
              fontSize: '1rem'
            },
            '& .MuiDialogContent-root': {
              p: 0,
              pb: 2
            },
            '& .MuiDialogActions-root': {
              p: 0,
              gap: 1
            }
          }
        }}
      >
        <DialogTitle>Sauvegarder le projet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du fichier"
            fullWidth
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            sx={{
              '& .MuiInputLabel-root': { 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.875rem'
              },
              '& .MuiInputBase-input': { 
                color: 'white',
                fontSize: '0.875rem',
                py: 1
              },
              '& .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'rgba(255, 255, 255, 0.3)' 
              },
              '&:hover .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'rgba(255, 255, 255, 0.5)' 
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                borderColor: 'white' 
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenSaveDialog(false)}
            sx={{ 
              fontSize: '0.875rem',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={saveFile} 
            disabled={!newFileName}
            sx={{ 
              fontSize: '0.875rem',
              color: 'white',
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)'
              },
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileManager;
