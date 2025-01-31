import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import NotionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import config from '../../config';

const ShareDialog = ({ open, onClose, projectId }) => {
  const [useToken, setUseToken] = useState(false);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [embedMode, setEmbedMode] = useState('iframe'); // 'iframe' ou 'notion'

  const generateToken = () => {
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setToken(newToken);
    updateProjectToken(newToken);
  };

  const updateProjectToken = async (newToken) => {
    try {
      await fetch(`${config.apiUrl}/api/embed/projects/${projectId}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: newToken }),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du token:', error);
    }
  };

  const getEmbedUrl = () => {
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    return `${baseUrl}/embed/projects/${projectId}${
      useToken && token ? `/${token}` : ''
    }`;
  };

  const getEmbedCode = () => {
    const embedUrl = getEmbedUrl();

    if (embedMode === 'notion') {
      return embedUrl;
    }

    return `<iframe
  src="${embedUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allowfullscreen
  style="border: none; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
></iframe>`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getEmbedCode());
    setCopied(true);
  };

  const handleTokenChange = (event) => {
    setUseToken(event.target.checked);
    if (event.target.checked && !token) {
      generateToken();
    } else if (!event.target.checked) {
      updateProjectToken(null);
    }
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>Partager le projet</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useToken}
                  onChange={handleTokenChange}
                  color="primary"
                />
              }
              label="Protéger l'accès avec un token"
            />
            {useToken && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Token d'accès"
                  value={token}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <IconButton 
                  onClick={generateToken}
                  color="primary"
                  size="small"
                  sx={{ flexShrink: 0 }}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Type d'intégration :
            </Typography>
            <ToggleButtonGroup
              value={embedMode}
              exclusive
              onChange={(e, newMode) => newMode && setEmbedMode(newMode)}
              size="small"
            >
              <ToggleButton value="iframe">
                <Tooltip title="Code HTML (iframe)">
                  <CodeIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="notion">
                <Tooltip title="URL pour Notion">
                  <NotionIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            {embedMode === 'notion' ? 'URL pour Notion :' : 'Code d\'intégration :'}
          </Typography>
          <TextField
            fullWidth
            multiline={embedMode === 'iframe'}
            rows={embedMode === 'iframe' ? 4 : 1}
            value={getEmbedCode()}
            variant="outlined"
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace' }
            }}
          />
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            variant="contained"
            sx={{ mt: 2 }}
          >
            Copier {embedMode === 'notion' ? 'l\'URL' : 'le code'}
          </Button>

          {embedMode === 'notion' && (
            <Box sx={{ mt: 2, bgcolor: 'info.main', color: 'info.contrastText', p: 2, borderRadius: 1 }}>
              <Typography variant="body2">
                Pour intégrer dans Notion :
                <ol style={{ marginTop: 8, marginBottom: 0 }}>
                  <li>Copiez l'URL ci-dessus</li>
                  <li>Dans Notion, tapez /embed</li>
                  <li>Collez l'URL</li>
                  <li>Ajustez la taille selon vos besoins</li>
                </ol>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {embedMode === 'notion' ? 'URL copiée !' : 'Code d\'intégration copié !'}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareDialog;
