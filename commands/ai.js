const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

// Historique des échanges par utilisateur
const userHistory = {};

module.exports = {
  name: 'ai',
  description: 'Interact with You-AI',
  usage: 'gpt4 [your message]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');

    const RP = ""; // Role Play optionnel

    if (!prompt) {
      return sendMessage(senderId, {
        text: "Veuillez poser votre question ou tapez 'help' pour voir les autres commandes disponibles."
      }, pageAccessToken);
    }

    // Initialiser l'historique de l'utilisateur
    if (!userHistory[senderId]) {
      userHistory[senderId] = [];
    }

    // Ajouter le message utilisateur
    userHistory[senderId].push(`User: ${prompt}`);

    // Garder au maximum 6 éléments (3 user + 3 AI)
    if (userHistory[senderId].length > 6) {
      while (userHistory[senderId].length > 6) {
        userHistory[senderId].splice(0, 2); // Supprime la plus ancienne paire
      }
    }

    const fullPrompt = `${RP}\n${userHistory[senderId].join('\n')}`;

    const apis = [
      `https://zaikyoov3-up.up.railway.app/api/perplexity-sonar-pro?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&imgs=1&system=1`,
      `https://zaikyoov3-up.up.railway.app/api/openai-gpt-4.1?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&imgs=1&system=1`,
      `https://zaikyoov3-up.up.railway.app/api/google-gemini-2.5-pro-preview?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&imgs=1&system=1`,
      `https://zaikyoov3-up.up.railway.app/api/01-ai-yi-large?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&system=1`,
      `https://api.nekorinn.my.id/ai/gemma-3-27b?text=${encodeURIComponent(fullPrompt)}`
    ];

    for (const url of apis) {
      try {
        const { data } = await axios.get(url);
        const response = data?.response || data?.result || data?.description || data?.reponse || data;

        if (response) {
          const fullResponse = response; // on conserve toute la réponse dans une seule variable

          // Ajouter la réponse complète de l'IA dans l'historique
          userHistory[senderId].push(`AI: ${fullResponse}`);

          // Nettoyer si l'historique dépasse 6 éléments
          if (userHistory[senderId].length > 6) {
            while (userHistory[senderId].length > 6) {
              userHistory[senderId].splice(0, 2);
            }
          }

          // Diviser pour envoi sans couper l'historique
          const parts = [];
          for (let i = 0; i < fullResponse.length; i += 1800) {
            parts.push(fullResponse.substring(i, i + 1800));
          }

          for (const part of parts) {
            await sendMessage(senderId, { text: part + ' 🪐' }, pageAccessToken);
          }

          return; // réponse envoyée avec succès
        }
      } catch (err) {
        console.warn(`❌ Échec de l'API : ${url} — ${err.message}`);
        continue;
      }
    }

    // Toutes les API ont échoué
    await sendMessage(senderId, {
      text: "😓 Toutes les IA sont injoignables pour le moment.\nRéessaie dans quelques instants."
    }, pageAccessToken);
  }
};
