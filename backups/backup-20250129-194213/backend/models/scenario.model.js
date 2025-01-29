const mongoose = require('mongoose');

const TransitionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['CUT', 'FADE', 'CROSSFADE'],
    default: 'CUT'
  },
  duration: {
    type: Number,
    default: 0
  }
}, { _id: false });

const ChoiceSchema = new mongoose.Schema({
  label: String,
  targetId: String,
  transition: TransitionSchema,
  conditions: [String],
  position: {
    x: Number,
    y: Number
  }
}, { _id: false });

const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['VIDEO', 'INTERACTIVE', 'BUTTON'],
    required: true
  },
  title: String,
  videoUrl: String,
  choices: [ChoiceSchema],
  position: {
    x: Number,
    y: Number
  },
  style: {
    width: Number,
    height: Number
  }
}, { _id: false });

const ScenarioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  nodes: [NodeSchema],
  startNodeId: String,
  variables: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pour mettre à jour updatedAt
ScenarioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Scenario', ScenarioSchema);
