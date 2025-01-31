import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Badge,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import presenceService from '../../services/presenceService';
import { USER_STATUS, USER_STATUS_LABELS, USER_STATUS_COLORS } from '../../types/presence';

const StyledBadge = styled(Badge)(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: status,
    color: status,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const MembersManager = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState(new Map());
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());

  useEffect(() => {
    const handlePresenceEvent = (event) => {
      switch (event.type) {
        case 'connection':
          setIsConnected(event.status);
          if (!event.status) {
            setUsers(new Map());
            setTypingUsers(new Set());
          }
          break;

        case 'message':
          const { type, users: userList, user, isTyping } = event.data;
          if (type === 'presence' && userList) {
            const usersMap = new Map();
            userList.forEach(user => {
              usersMap.set(user.userId, user);
            });
            setUsers(usersMap);
          } else if (type === 'typing') {
            setTypingUsers(prevTyping => {
              const newTyping = new Set(prevTyping);
              if (isTyping) {
                newTyping.add(user.userId);
              } else {
                newTyping.delete(user.userId);
              }
              return newTyping;
            });
          }
          break;

        case 'notification':
          setNotification(event.message);
          break;

        case 'error':
          console.error('Erreur présence:', event.error);
          setError('Erreur de connexion au service de présence');
          break;
      }
    };

    presenceService.addListener(handlePresenceEvent);
    
    if (!presenceService.isConnected) {
      presenceService.connect();
    }

    return () => {
      presenceService.removeListener(handlePresenceEvent);
    };
  }, []);

  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="h6">
          Membres en ligne ({users.size})
        </Typography>
        <Chip 
          size="small"
          label={isConnected ? "Connecté" : "Déconnecté"}
          color={isConnected ? "success" : "error"}
        />
      </Box>
      
      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}
      
      <List>
        {Array.from(users.values()).map((user) => (
          <ListItem key={user.userId}>
            <ListItemAvatar>
              <StyledBadge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                variant="dot"
                status={USER_STATUS_COLORS[user.status]}
              >
                <Avatar 
                  alt={user.displayName} 
                  src={user.avatarUrl}
                  sx={{ width: 40, height: 40 }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </Avatar>
              </StyledBadge>
            </ListItemAvatar>
            <ListItemText 
              primary={user.displayName}
              secondary={USER_STATUS_LABELS[user.status]}
            />
            <ListItemSecondaryAction>
              {typingUsers.has(user.userId) && (
                <Typography variant="caption" color="text.secondary">
                  En train d'écrire...
                </Typography>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseNotification} severity="info">
          {notification}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MembersManager;
