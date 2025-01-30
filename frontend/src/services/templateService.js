import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Crée un template de projet basé sur un graphe narratif
 * @param {string} title - Titre du template
 * @param {Object[]} nodes - Liste des nœuds narratifs
 * @param {Object[]} edges - Liste des connexions entre nœuds
 */
export async function createNarrativeTemplate(title, nodes, edges) {
  try {
    const zip = new JSZip();
    
    // Générer les positions des nœuds en grille
    const nodesPerRow = Math.ceil(Math.sqrt(nodes.length));
    const spacing = 250;
    
    // Créer les nœuds du projet
    const projectNodes = nodes.map((nodeName, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      
      return {
        id: `node-${index}`,
        type: 'buttonNode',
        position: { 
          x: col * spacing + 100,
          y: row * spacing + 100
        },
        data: {
          label: nodeName,
          description: `Scène: ${nodeName}`,
          actions: []
        }
      };
    });

    // Créer les connexions
    const projectEdges = edges.map((edge, index) => {
      const sourceIndex = nodes.indexOf(edge[0]);
      const targetIndex = nodes.indexOf(edge[1]);
      
      return {
        id: `edge-${index}`,
        source: `node-${sourceIndex}`,
        target: `node-${targetIndex}`,
        type: 'default'
      };
    });

    // Créer le scénario
    const scenario = {
      nodes: projectNodes,
      edges: projectEdges,
      version: '1.0',
      title: title,
      created: new Date().toISOString()
    };

    // Ajouter au ZIP
    zip.file('scenario.json', JSON.stringify(scenario, null, 2));

    // Générer le ZIP
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Sauvegarder le fichier
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveAs(content, `template-${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pov`);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la création du template:', error);
    throw error;
  }
}

/**
 * Template pour "Tables Fatales"
 */
export function createTablesFatalesTemplate() {
  const nodes = [
    "Départ", "Table 4 (Dispute)", "Table 7 (Femme seule)", "Table 2 (Groupe suspect)",
    "Suivre la femme", "Interroger l'homme", "Observer d'autres tables",
    "Femme -> Vestiaire", "Femme -> Objet suspect", "Homme -> Objet suspect",
    "Lire le papier", "Suivre l'homme", "Retourner à la salle",
    "Confrontation femme", "Confrontation homme", "Confrontation serveur",
    "Finale : Coupable arrêté", "Finale : Fausse accusation", "Finale : Crime commis"
  ];

  const edges = [
    ["Départ", "Table 4 (Dispute)"], ["Départ", "Table 7 (Femme seule)"], ["Départ", "Table 2 (Groupe suspect)"],
    ["Table 4 (Dispute)", "Suivre la femme"], ["Table 4 (Dispute)", "Interroger l'homme"], ["Table 4 (Dispute)", "Observer d'autres tables"],
    ["Table 7 (Femme seule)", "Femme -> Vestiaire"], ["Table 7 (Femme seule)", "Femme -> Objet suspect"],
    ["Table 2 (Groupe suspect)", "Lire le papier"], ["Table 2 (Groupe suspect)", "Suivre l'homme"], ["Table 2 (Groupe suspect)", "Retourner à la salle"],
    ["Suivre la femme", "Confrontation femme"], ["Interroger l'homme", "Homme -> Objet suspect"],
    ["Femme -> Vestiaire", "Confrontation femme"], ["Femme -> Objet suspect", "Confrontation femme"],
    ["Lire le papier", "Confrontation serveur"], ["Suivre l'homme", "Confrontation serveur"],
    ["Confrontation femme", "Finale : Coupable arrêté"], ["Confrontation femme", "Finale : Fausse accusation"],
    ["Confrontation homme", "Finale : Coupable arrêté"], ["Confrontation homme", "Finale : Crime commis"],
    ["Confrontation serveur", "Finale : Coupable arrêté"], ["Confrontation serveur", "Finale : Fausse accusation"]
  ];

  return createNarrativeTemplate("Tables Fatales", nodes, edges);
}
