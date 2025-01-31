import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Badge,
  Dialog,
  useTheme,
  Alert
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import InviteMemberDialog from './InviteMemberDialog';
import EditMemberDialog from './EditMemberDialog';
import { API_URL, WS_URL } from '@constants/api';
import useWebSocket from '@/hooks/useWebSocket';

const roleColors = {
  owner: '#8bc34a',
  admin: '#ff9800',
  editor: '#2196f3',
  viewer: '#757575'
};

const MembersManager = ({ projectId }) => {
  const theme = useTheme();
  const [members, setMembers] = useState([]);
  const [openInvite, setOpenInvite] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [error, setError] = useState(null);

  const { isConnected } = useWebSocket(`${WS_URL}/presence`, {
    onMessage: (data) => {
      if (data.type === 'presence') {
        setOnlineUsers(new Set(data.onlineUsers));
      }
    },
    onError: (err) => {
      console.error('WebSocket error:', err);
      setError('Erreur de connexion au service de présence');
    }
  });

  // Charger la liste des membres
  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/collaboration/projects/${projectId}/members`);
      if (!response.ok) throw new Error('Erreur lors du chargement des membres');
      const data = await response.json();
      setMembers(data);
      setError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors du chargement des membres');
    }
  };

  // Supprimer un membre
  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/collaboration/projects/${projectId}/members/${userId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      await fetchMembers();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Gérer l'édition d'un membre
  const handleEditMember = (member) => {
    setSelectedMember(member);
    setOpenEdit(true);
  };

  // Mise à jour après modification
  const handleMemberUpdated = () => {
    fetchMembers();
    setOpenEdit(false);
    setSelectedMember(null);
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Membres du projet</Typography>
        <Box>
          {!isConnected && (
            <Chip
              label="Hors ligne"
              color="error"
              size="small"
              sx={{ mr: 1 }}
            />
          )}
          <IconButton 
            color="primary" 
            onClick={() => setOpenInvite(true)}
            sx={{ backgroundColor: theme.palette.primary.main + '20' }}
          >
            <PersonAddIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <List>
          {members.map((member) => (
            <ListItem key={member.user._id} divider>
              <ListItemAvatar>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color={onlineUsers.has(member.user._id) ? "success" : "default"}
                >
                  <Avatar src={member.user.avatar} alt={member.user.username}>
                    {member.user.username[0].toUpperCase()}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={member.user.username}
                secondary={member.user.email}
              />
              <Chip
                label={member.role}
                size="small"
                sx={{
                  backgroundColor: roleColors[member.role],
                  color: 'white',
                  mr: 1
                }}
              />
              <ListItemSecondaryAction>
                {member.role !== 'owner' && (
                  <>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleEditMember(member)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveMember(member.user._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <InviteMemberDialog
        open={openInvite}
        onClose={() => setOpenInvite(false)}
        projectId={projectId}
        onMemberAdded={fetchMembers}
      />

      <EditMemberDialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        member={selectedMember}
        projectId={projectId}
        onMemberUpdated={handleMemberUpdated}
      />
    </Box>
  );
};

export default MembersManager;
