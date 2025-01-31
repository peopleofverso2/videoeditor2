import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  AvatarGroup,
  Tooltip,
  Badge,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import presenceService from '../../services/presenceService';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
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

const OnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const handlePresenceUpdate = (data) => {
      if (data.type === 'presence') {
        setOnlineUsers(data.users || []);
      }
    };

    presenceService.addListener(handlePresenceUpdate);
    return () => presenceService.removeListener(handlePresenceUpdate);
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        label={`${onlineUsers.length} en ligne`}
        color="success"
        size="small"
        sx={{
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: '16px',
          '& .MuiChip-label': {
            px: 1,
          },
        }}
      />
      <AvatarGroup
        max={3}
        sx={{
          '& .MuiAvatar-root': {
            width: 30,
            height: 30,
            fontSize: '0.875rem',
            border: '2px solid white',
          },
        }}
      >
        {onlineUsers.map((user) => (
          <Tooltip key={user.userId} title={user.displayName}>
            <StyledBadge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
            >
              <Avatar
                alt={user.displayName}
                src={user.avatarUrl}
                sx={{
                  bgcolor: user.avatarUrl ? 'transparent' : 'primary.main',
                }}
              >
                {!user.avatarUrl && user.displayName.charAt(0)}
              </Avatar>
            </StyledBadge>
          </Tooltip>
        ))}
      </AvatarGroup>
    </Box>
  );
};

export default OnlineUsers;
