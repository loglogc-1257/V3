const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

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

    if (!userHistory[senderId]) userHistory[senderId] = [];
    userHistory[senderId].push(`User: ${prompt}`);
    if (userHistory[senderId].length > 6) userHistory[senderId].splice(0, userHistory[senderId].length - 6);

    const fullPrompt = `${RP}\n${userHistory[senderId].join('\n')}`;

    const urls = [
      `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`,
      `https://mybot-rest.kozow.com/api/gemini?ask=${encodeURIComponent(fullPrompt)}`,
      `https://mybot-rest.kozow.com/api/gemini-2.5-flash?ask=${encodeURIComponent(fullPrompt)}`,
      `https://zaikyoov3-up.up.railway.app/api/perplexity-sonar-pro?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&imgs=1&system=1`,
      `https://zaikyoov3-up.up.railway.app/api/01-ai-yi-large?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&system=1`,
      `https://api.nekorinn.my.id/ai/gemma-3-27b?text=${encodeURIComponent(fullPrompt)}`
    ];

    const fetchWithTimeout = (url) => {
      return new Promise(async (resolve) => {
        try {
          const { data } = await axios.get(url, { timeout: 10000 }); // max 10 sec
          const response = typeof data === 'string'
            ? data
            : (data?.response || data?.result || data?.description || data?.reponse || data);
          if (response && typeof response === 'string' && response.trim().length > 0) {
            resolve(response.trim());
          } else {
            resolve(null);
          }
        } catch (err) {
          console.warn(`❌ ${url} — ${err.message}`);
          resolve(null);
        }
      });
    };

    // Lancer toutes les requêtes en parallèle
    const promises = urls.map(fetchWithTimeout);

    let resolved = false;

    // Étape 1 : attendre 5 secondes pour une première réponse
    const fastTry = Promise.any(
      promises.map(p => Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]))
    ).catch(() => null);

    let result = await fastTry;

    // Étape 2 : si rien en 5s, attendre 5s de plus (au total 10s)
    if (!result) {
      const slowTry = Promise.any(promises).catch(() => null);
      result = await slowTry;
    }

    if (result) {
      userHistory[senderId].push(`AI: ${result}`);
      if (userHistory[senderId].length > 6) userHistory[senderId].splice(0, userHistory[senderId].length - 6);

      const parts = [];
      for (let i = 0; i < result.length; i += 1800) {
        parts.push(result.substring(i, i + 1800));
      }

      for (const part of parts) {
        await sendMessage(senderId, { text: part + ' 🪐' }, pageAccessToken);
      }
    } else {
      await sendMessage(senderId, {
        text: "😓 Aucune IA n'a répondu dans le temps imparti.\nRéessaie dans quelques instants."
      }, pageAccessToken);
    }
  }
};
