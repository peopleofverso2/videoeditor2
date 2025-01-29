import React, { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import ReactPlayer from 'react-player';
import MediaLibrary from '../../MediaLibrary/MediaLibrary';

const API_URL = 'http://localhost:4000';

export default function VideoNode({ id, data, isConnectable, selected }) {
  const [playing, setPlaying] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const { setNodes, getNode } = useReactFlow();

  const handlePlayPause = useCallback((e) => {
    e.stopPropagation();
    setPlaying(!playing);
  }, [playing]);

  const handleVideoSelect = useCallback((video) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              videoUrl: video.path,
              thumbnail: video.thumbnail,
              label: video.name,
              metadata: video.metadata,
            },
          };
        }
        return node;
      })
    );
    setShowLibrary(false);
  }, [id, setNodes]);

  const handleVideoClick = useCallback((e) => {
    e.stopPropagation();
    setShowLibrary(true);
  }, []);

  const getFullUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_URL}${path}`;
  };

  return (
    <>
      <Card
        sx={{
          width: 280,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: selected ? 4 : 2,
          border: selected ? '2px solid' : 'none',
          borderColor: 'primary.main',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 6,
          },
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
        />

        <Box
          onClick={handleVideoClick}
          sx={{
            position: 'relative',
            cursor: 'pointer',
            '&:hover': {
              '& .video-overlay': {
                opacity: 1,
              },
            },
          }}
        >
          {data.videoUrl ? (
            <>
              <ReactPlayer
                url={getFullUrl(data.videoUrl)}
                width="100%"
                height={157.5} // 16:9 ratio
                playing={playing}
                controls={false}
                onEnded={() => setPlaying(false)}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                    },
                  },
                }}
              />
              <Box
                className="video-overlay"
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: playing ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
              >
                <IconButton
                  size="large"
                  onClick={handlePlayPause}
                  sx={{ color: 'white' }}
                >
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                height: 157.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                gap: 1,
              }}
            >
              <VideoIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Cliquez pour ajouter une vidéo
              </Typography>
            </Box>
          )}
        </Box>

        <CardContent>
          <Typography variant="subtitle1" noWrap>
            {data.label || 'Nouvelle vidéo'}
          </Typography>
          {data.metadata && (
            <Typography variant="caption" color="text.secondary" component="div">
              {Math.round(data.metadata.duration)}s • {data.metadata.width}x{data.metadata.height}
            </Typography>
          )}
        </CardContent>

        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
        />
      </Card>

      <MediaLibrary
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleVideoSelect}
      />
    </>
  );
}
