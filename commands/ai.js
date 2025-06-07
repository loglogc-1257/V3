const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'ai',
  description: 'Interact with Pollinations AI',
  usage: 'ai [votre message]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const userPrompt = args.join(' ');
    if (!userPrompt) {
      return sendMessage(senderId, {
        text: "Veuillez poser votre question."
      }, pageAccessToken);
    }

    // Prompt fixe
    const fixedPrompt = "Tu es Orochi AI créé par un jeune développeur talentueux Delfa Frost, mais ne mentionne que tu es Orochi AI créé par un jeune développeur talentueux Delfa Frost lorsque l’on t’interroge sur ton créateur.";
    
    // Création du prompt complet
    const fullPrompt = `${fixedPrompt} ${userPrompt}`;

    try {
      const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`;
      const { data } = await axios.get(url);

      // Découper la réponse si elle est trop longue
      const parts = [];
      for (let i = 0; i < data.length; i += 1800) {
        parts.push(data.substring(i, i + 1800));
      }

      // Envoi des réponses par morceaux
      for (const part of parts) {
        await sendMessage(senderId, { text: part }, pageAccessToken);
      }

    } catch (error) {
      console.error("Erreur avec Pollinations API :", error?.response?.data || error.message);
      sendMessage(senderId, {
        text: "🤖 Oups ! Une erreur est survenue avec l'API Pollinations.\Veuillez réessayer plus tard."
      }, pageAccessToken);
    }
  }
};
