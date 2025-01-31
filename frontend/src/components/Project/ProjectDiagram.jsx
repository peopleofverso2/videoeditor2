import React from 'react';
import { Box, Paper, Typography, Grid, IconButton } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import TuneIcon from '@mui/icons-material/Tune';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const VideoThumbnail = ({ videoUrl }) => {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 1;
    }
  }, [videoUrl]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        bgcolor: 'rgba(0,0,0,0.2)',
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </Box>
  );
};

const NodePreview = ({ node, onDelete, onOpen }) => {
  const isVideo = node.type === 'videoNode';
  const videoUrl = isVideo && node.data?.url;
  
  return (
    <Paper 
      onClick={() => onOpen?.(node.id)}
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        bgcolor: isVideo ? 'primary.dark' : 'secondary.dark',
        borderRadius: 2,
        width: 220,
        height: 180,
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          '& .actions': {
            opacity: 1
          },
          '& .overlay': {
            opacity: 1
          }
        }
      }}
    >
      {/* Actions rapides */}
      <Box 
        className="actions"
        sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8,
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out',
          zIndex: 2,
          display: 'flex',
          gap: 1
        }}
      >
        <IconButton 
          size="small" 
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.4)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.6)'
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(node.id);
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          sx={{ 
            color: 'white',
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.(node.id);
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Overlay au survol */}
      <Box
        className="overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0,0,0,0.3)',
          opacity: 0,
          transition: 'opacity 0.2s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          borderRadius: 2
        }}
      >
        <OpenInNewIcon sx={{ color: 'white', fontSize: 32 }} />
      </Box>

      <Box sx={{ 
        width: '100%',
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mb: 1,
        position: 'relative'
      }}>
        {isVideo && videoUrl ? (
          <VideoThumbnail videoUrl={videoUrl} />
        ) : (
          <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.2)',
            borderRadius: 1
          }}>
            {isVideo ? (
              <MovieIcon sx={{ fontSize: 40, color: 'primary.light' }} />
            ) : (
              <TuneIcon sx={{ fontSize: 40, color: 'secondary.light' }} />
            )}
          </Box>
        )}
      </Box>

      <Typography 
        variant="subtitle2" 
        align="center"
        sx={{ 
          color: 'white',
          fontWeight: 'medium',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          zIndex: 2
        }}
      >
        {node.data?.label || 'Sans titre'}
      </Typography>

      {isVideo && node.data?.filename && (
        <Typography 
          variant="caption" 
          align="center"
          sx={{ 
            color: 'rgba(255,255,255,0.7)',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            zIndex: 2
          }}
        >
          {node.data.filename}
        </Typography>
      )}
    </Paper>
  );
};

const ProjectDiagram = ({ nodes, onDeleteNode, onOpenNode }) => {
  return (
    <Box sx={{ 
      p: 3, 
      width: '100%', 
      height: '100%',
      bgcolor: 'background.default',
      overflowY: 'auto'
    }}>
      <Grid 
        container 
        spacing={3} 
        justifyContent="flex-start"
        alignItems="flex-start"
      >
        {nodes.map((node) => (
          <Grid item key={node.id}>
            <NodePreview 
              node={node} 
              onDelete={onDeleteNode}
              onOpen={onOpenNode}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ProjectDiagram;
