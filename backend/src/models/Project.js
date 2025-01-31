import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  nodes: [{
    type: Object
  }],
  edges: [{
    type: Object
  }]
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
