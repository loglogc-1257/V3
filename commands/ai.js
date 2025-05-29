const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'ai',
  description: 'Interact with You-AI',
  usage: 'gpt4 [your message]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    const RP = "tu es Stanley bot v4 créé par Stanley stawa ";

    if (!prompt) {
      return sendMessage(senderId, {
        text: "Veuillez poser votre question ou tapez 'help' pour voir les autres commandes disponibles."
      }, pageAccessToken);
    }

    try {
      const fullPrompt = `${RP} : ${prompt}`;
      const apiUrl = `https://api.nekorinn.my.id/ai/gemma-3-27b?text=${encodeURIComponent(fullPrompt)}`;

      const { data } = await axios.get(apiUrl);
      const response = data?.result || data?.description || data?.reponse || data;

      if (response) {
        const parts = [];
        for (let i = 0; i < response.length; i += 1800) {
          parts.push(response.substring(i, i + 1800));
        }

        for (const part of parts) {
          await sendMessage(senderId, { text: part + ' 🪐' }, pageAccessToken);
        }
      } else {
        await sendMessage(senderId, {
          text: "Aucune réponse valide reçue de l'API."
        }, pageAccessToken);
      }

    } catch (err) {
      console.error("Erreur API AI:", err.message || err);
      sendMessage(senderId, {
        text: "🤖 Oups ! Une petite erreur est survenue.\n\n" +
              "❓ Veuillez poser votre question ou tapez 'help' pour voir les autres commandes disponibles."
      }, pageAccessToken);
    }
  }
};
