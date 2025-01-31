import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography
} from '@mui/material';
import { API_URL } from '@constants/api';

const roles = [
  { value: 'viewer', label: 'Lecteur' },
  { value: 'editor', label: 'Éditeur' },
  { value: 'admin', label: 'Administrateur' }
];

const EditMemberDialog = ({ open, onClose, member, projectId, onMemberUpdated }) => {
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setRole(member.role);
    }
  }, [member]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/collaboration/projects/${projectId}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId: member.user._id,
          newRole: role
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }

      onMemberUpdated();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Modifier le rôle du membre</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Typography variant="body2" sx={{ mb: 2 }}>
              Modification du rôle de {member.user.username} ({member.user.email})
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Rôle</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="Rôle"
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
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || role === member.role}
          >
            {loading ? 'Modification...' : 'Modifier'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditMemberDialog;
