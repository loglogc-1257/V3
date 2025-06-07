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
      'GEMINI',
      `https://api.nekorinn.my.id/ai/gemma-3-27b?text=${encodeURIComponent(fullPrompt)}`
    ];

    const GEMINI_API_KEY = 'AIzaSyAV0s2XU0gkrfkWiBOMxx6d6AshqnyPbiE';

    const fetchGemini = () => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      const data = {
        contents: [{ parts: [{ text: fullPrompt }] }]
      };
      return axios.post(url, data, {
        headers: { 'Content-Type': 'application/json' }
      }).then(({ data }) => {
        const choices = data?.candidates || data?.results || [];
        if (choices.length > 0 && choices[0].content) {
          return choices[0].content.trim();
        }
        throw new Error('Réponse vide Gemini');
      });
    };

    const fetchWithUrl = (url) => {
      return axios.get(url).then(({ data }) => {
        const response = typeof data === 'string'
          ? data
          : (data?.response || data?.result || data?.description || data?.reponse || data);
        if (response && typeof response === 'string' && response.trim().length > 0) {
          return response.trim();
        }
        throw new Error('Réponse vide');
      });
    };

    try {
      const promises = urls.map(url => url === 'GEMINI' ? fetchGemini() : fetchWithUrl(url));
      const response = await Promise.any(promises);

      userHistory[senderId].push(`AI: ${response}`);
      if (userHistory[senderId].length > 6) userHistory[senderId].splice(0, userHistory[senderId].length - 6);

      // Envoi en plusieurs parties dans l'ordre, une partie après l'autre
      for (let i = 0; i < response.length; i += 1800) {
        const part = response.substring(i, i + 1800);
        await sendMessage(senderId, { text: part + ' 🪐' }, pageAccessToken);
      }

    } catch (err) {
      console.warn("❌ Aucune API n'a répondu utilement.");
      await sendMessage(senderId, {
        text: "😓 Toutes les IA sont injoignables.\nRéessaie dans quelques instants."
      }, pageAccessToken);
    }
  }
};
