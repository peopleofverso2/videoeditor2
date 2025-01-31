import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert
} from '@mui/material';
import { API_URL } from '@constants/api';

const roles = [
  { value: 'viewer', label: 'Lecteur' },
  { value: 'editor', label: 'Éditeur' },
  { value: 'admin', label: 'Administrateur' }
];

const InviteMemberDialog = ({ open, onClose, projectId, onMemberAdded }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/collaboration/projects/${projectId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'invitation");
      }

      onClose();
      setEmail('');
      setRole('viewer');
      onMemberAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Inviter un membre</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="Rôle"
                required
              >
                {roles.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Envoi...' : 'Inviter'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InviteMemberDialog;
