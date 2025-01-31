export const generateMermaidDiagram = (nodes, edges) => {
  let mermaidCode = 'graph LR\n';
  mermaidCode += '  %% Styles\n';
  mermaidCode += '  linkStyle default stroke-width:2px\n\n';

  // Ajouter les nœuds
  nodes.forEach(node => {
    const nodeLabel = node.data.label || 'Sans titre';
    const nodeType = node.type === 'videoNode' ? '🎥' : '🔘';
    // Utiliser des crochets pour un style plus arrondi
    mermaidCode += `  ${node.id}[${nodeType} ${nodeLabel}]\n`;
  });

  // Ajouter les connexions avec des flèches plus visibles
  edges.forEach(edge => {
    mermaidCode += `  ${edge.source} ==> ${edge.target}\n`;
  });

  return mermaidCode;
};
