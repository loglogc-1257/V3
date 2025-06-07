const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

const userHistory = {};
const API_KEY_GEMINI = 'AIzaSyAV0s2XU0gkrfkWiBOMxx6d6AshqnyPbiE';

// API officielle Gemini (POST)
const fetchGeminiOfficial = (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY_GEMINI}`;
  return axios.post(
    url,
    { contents: [{ parts: [{ text: prompt }] }] },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
  ).then(res => res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
};

// API GET génériques
const fetchGET = (url) => {
  return axios.get(url, { timeout: 10000 }).then(({ data }) => {
    const response = typeof data === 'string'
      ? data
      : (data?.response || data?.result || data?.description || data?.reponse || data);
    return (typeof response === 'string' && response.trim()) ? response.trim() : Promise.reject('Empty');
  });
};

module.exports = {
  name: 'ai',
  description: 'Interact with You-AI',
  usage: 'gpt4 [votre message]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    const RP = "";

    if (!prompt) {
      return sendMessage(senderId, {
        text: "❓ Veuillez poser votre question ou tapez 'help' pour voir les commandes disponibles."
      }, pageAccessToken);
    }

    // Historique
    if (!userHistory[senderId]) userHistory[senderId] = [];
    userHistory[senderId].push(`User: ${prompt}`);
    if (userHistory[senderId].length > 6) userHistory[senderId].splice(0, userHistory[senderId].length - 6);

    const fullPrompt = `${RP}\n${userHistory[senderId].join('\n')}`;

    // Liste API principales
    const primaryCalls = [
      () => fetchGeminiOfficial(fullPrompt),
      () => fetchGET(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`),
      () => fetchGET(`https://mybot-rest.kozow.com/api/gemini?ask=${encodeURIComponent(fullPrompt)}`),
      () => fetchGET(`https://mybot-rest.kozow.com/api/gemini-2.5-flash?ask=${encodeURIComponent(fullPrompt)}`),
      () => fetchGET(`https://zaikyoov3-up.up.railway.app/api/perplexity-sonar-pro?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&imgs=1&system=1`),
      () => fetchGET(`https://zaikyoov3-up.up.railway.app/api/01-ai-yi-large?prompt=${encodeURIComponent(fullPrompt)}&uid=${senderId}&system=1`),
      () => fetchGET(`https://api.nekorinn.my.id/ai/gemma-3-27b?text=${encodeURIComponent(fullPrompt)}`)
    ];

    // Requêtes parallèles
    let response;
    try {
      response = await Promise.any(primaryCalls.map(fn => fn()));
    } catch {
      // Toutes échouées ? → Réessaie Pollinations & Gemini seulement
      try {
        response = await Promise.any([
          () => fetchGET(`https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`),
          () => fetchGeminiOfficial(fullPrompt)
        ].map(fn => fn()));
      } catch {
        console.warn("❌ Toutes les APIs ont échoué même après 2e tentative.");
        return sendMessage(senderId, {
          text: "😓 Toutes les IA sont injoignables pour le moment. Réessaie dans quelques instants."
        }, pageAccessToken);
      }
    }

    // Historique AI
    userHistory[senderId].push(`AI: ${response}`);
    if (userHistory[senderId].length > 6) userHistory[senderId].splice(0, userHistory[senderId].length - 6);

    // Réponse découpée
    const parts = [];
    for (let i = 0; i < response.length; i += 1800) {
      parts.push(response.substring(i, i + 1800));
    }

    for (const part of parts) {
      await sendMessage(senderId, { text: part + ' 🪐' }, pageAccessToken);
    }
  }
};
