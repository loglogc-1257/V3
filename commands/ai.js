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
    const RP = "";

    if (!prompt) {
      return sendMessage(senderId, {
        text: "Veuillez poser votre question ou tapez 'help' pour voir les autres commandes disponibles."
      }, pageAccessToken);
    }

    if (!userHistory[senderId]) {
      userHistory[senderId] = [];
    }

    userHistory[senderId].push(`User: ${prompt}`);

    if (userHistory[senderId].length > 6) {
      while (userHistory[senderId].length > 6) {
        userHistory[senderId].splice(0, 2);
      }
    }

    const fullPrompt = `${RP}\n${userHistory[senderId].join('\n')}`;

    const apis = [
      `https://zaikyoov3-up.up.railway.app/api/perplexity-sonar-pro?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&imgs=1&system=1`,
      `https://api.pollinations.ai/text=${encodeURIComponent(fullPrompt)}`, // <== API Pollinations ici
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
          const fullResponse = typeof response === 'string' ? response : JSON.stringify(response);

          userHistory[senderId].push(`AI: ${fullResponse}`);

          if (userHistory[senderId].length > 6) {
            while (userHistory[senderId].length > 6) {
              userHistory[senderId].splice(0, 2);
            }
          }

          const parts = [];
          for (let i = 0; i < fullResponse.length; i += 1800) {
            parts.push(fullResponse.substring(i, i + 1800));
          }

          for (const part of parts) {
            await sendMessage(senderId, { text: part + ' 🪐' }, pageAccessToken);
          }

          return;
        }
      } catch (err) {
        console.warn(`❌ Échec de l'API : ${url} — ${err.message}`);
        continue;
      }
    }

    await sendMessage(senderId, {
      text: "😓 Toutes les IA sont injoignables pour le moment.\nRéessaie dans quelques instants."
    }, pageAccessToken);
  }
};
