// bot.js

require('dotenv').config();
const { Telegraf } = require('telegraf');
const { setupCommands } = require('./commands');
const { setupHandlers } = require('./handlers');

const bot = new Telegraf(process.env.BOT_TOKEN);

setupCommands(bot);
setupHandlers(bot);

bot.launch().then(() => {
    console.log('Bot listo para recibir mensajes');
}).catch((error) => {
    console.error('Error al iniciar el bot:', error);
});
