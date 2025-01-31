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
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import config from '../../config';

const ShareProject = ({ open, onClose, projectId }) => {
  const [useToken, setUseToken] = useState(false);
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);

  const generateToken = () => {
    // Génère un token aléatoire de 32 caractères
    const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setToken(token);
    return token;
  };

  const getEmbedCode = () => {
    const embedUrl = `${window.location.origin}/embed/projects/${projectId}${
      useToken ? `?token=${token}` : ''
    }`;

    return `<iframe 
  src="${embedUrl}"
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen
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
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Token d'accès"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  variant="outlined"
                  size="small"
                />
                <Button
                  onClick={generateToken}
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Générer un nouveau token
                </Button>
              </Box>
            )}
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Code d'intégration :
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={getEmbedCode()}
            variant="outlined"
            InputProps={{
              readOnly: true,
            }}
          />
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            sx={{ mt: 2 }}
          >
            Copier le code
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={3000}
        onClose={() => setCopied(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Code d'intégration copié !
        </Alert>
      </Snackbar>
    </>
  );
};

export default ShareProject;
