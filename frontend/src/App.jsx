import React, { useState, useCallback } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box, 
  IconButton, 
  Drawer,
  Container
} from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Group as GroupIcon } from '@mui/icons-material';
import NodeEditor from './components/NodeEditor/NodeEditor';
import Toolbar from './components/Toolbar/Toolbar';
import PreviewModal from './components/Preview/PreviewModal';
import MembersManager from './components/Collaboration/MembersManager';
import ProjectSelector from './components/Project/ProjectSelector';
import MediaLibrary from './components/MediaLibrary/MediaLibrary';
import VideoNode from './components/VideoNode';
import { useNodesState, useEdgesState, ReactFlowProvider } from 'reactflow';
import { exportProject, exportProjectWithMedia, importProject } from './services/exportService';
import { API_URL } from './constants/api';
import 'reactflow/dist/style.css';
