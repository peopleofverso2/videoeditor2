import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';

export default function InteractiveNode({ data, isConnectable }) {
  const [choices, setChoices] = useState(data.choices || []);

  const handleAddChoice = () => {
    const newChoice = {
      id: `choice-${Date.now()}`,
      label: 'Nouveau choix',
      targetId: null,
    };
    setChoices([...choices, newChoice]);
  };

  const handleEditChoice = (choiceId) => {
    // Ouvre le dialogue d'édition du choix
    console.log('Edit choice:', choiceId);
  };

  return (
    <Card
      sx={{
        width: 280,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />

      <CardContent>
        <Typography variant="h6" gutterBottom>
          {data.label}
          <IconButton
            size="small"
            onClick={data.onEdit}
            sx={{ ml: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Typography>

        <List dense>
          {choices.map((choice) => (
            <ListItem
              key={choice.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  size="small"
                  onClick={() => handleEditChoice(choice.id)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              }
              disablePadding
            >
              <ListItemButton>
                <ListItemText primary={choice.label} />
              </ListItemButton>
            </ListItem>
          ))}
          
          <ListItem disablePadding>
            <ListItemButton onClick={handleAddChoice}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              <ListItemText primary="Ajouter un choix" />
            </ListItemButton>
          </ListItem>
        </List>
      </CardContent>

      {choices.map((choice) => (
        <Handle
          key={choice.id}
          type="source"
          position={Position.Bottom}
          id={choice.id}
          isConnectable={isConnectable}
          style={{
            left: `${(choices.indexOf(choice) + 1) * (100 / (choices.length + 1))}%`,
          }}
        />
      ))}
    </Card>
  );
}
