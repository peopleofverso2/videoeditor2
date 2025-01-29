const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

/**
 * Génère des suggestions de transitions basées sur le contexte
 */
async function suggestTransitions(currentNode, nextNode) {
  const prompt = `Suggérer une transition vidéo naturelle entre ces deux scènes :
    Scène 1 : ${currentNode.title || 'Début'}
    Scène 2 : ${nextNode.title || 'Suite'}
    
    Répondre uniquement avec un des types suivants : CUT, FADE, CROSSFADE`;

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Tu es un expert en montage vidéo.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 50
  });

  return response.data.choices[0].message.content.trim();
}

/**
 * Génère des suggestions de choix interactifs
 */
async function suggestChoices(currentNode, context) {
  const prompt = `Pour cette scène : "${currentNode.title}", 
    suggérer 2-3 choix naturels pour continuer l'histoire.
    
    Format : Un choix par ligne, maximum 50 caractères par choix`;

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Tu es un expert en narration interactive.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 100
  });

  return response.data.choices[0].message.content
    .split('\n')
    .filter(choice => choice.trim())
    .map(choice => ({
      label: choice.trim(),
      type: 'BUTTON'
    }));
}

module.exports = {
  suggestTransitions,
  suggestChoices
};
