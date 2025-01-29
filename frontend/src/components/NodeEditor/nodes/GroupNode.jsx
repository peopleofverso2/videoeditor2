import React, { memo, useState } from 'react';
import { Handle } from 'reactflow';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  Stack,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Edit,
} from '@mui/icons-material';

const GroupNode = ({ data, selected }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Box
      sx={{
        minWidth: 200,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: selected ? 4 : 2,
        border: selected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          p: 1,
          borderBottom: isExpanded ? '1px solid #e0e0e0' : 'none',
          bgcolor: selected ? 'action.selected' : 'transparent',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 500,
            flex: 1,
            color: selected ? 'primary.main' : 'text.primary',
          }}
        >
          {data.label || 'Groupe'}
        </Typography>

        <IconButton
          size="small"
          onClick={data.onEdit}
        >
          <Edit fontSize="small" />
        </IconButton>
      </Stack>

      <Collapse in={isExpanded}>
        <Box
          sx={{
            p: 2,
            minHeight: 100,
            bgcolor: 'action.hover',
            borderRadius: '0 0 8px 8px',
          }}
        >
          {/* Zone pour les nœuds enfants */}
          {data.childNodes?.map((node) => (
            <Box
              key={node.id}
              sx={{
                p: 1,
                mb: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: '1px solid #e0e0e0',
              }}
            >
              <Typography variant="body2">
                {node.data.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>

      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position="right"
        style={{ background: '#555' }}
      />
    </Box>
  );
};

export default memo(GroupNode);
