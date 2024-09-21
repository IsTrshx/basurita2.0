const { saveAllowedUser, deleteAllowedUser, loadAllowedUsers, getStats } = require('./utils');

let allowedUsers = [];

async function reloadAllowedUsers() {
    return new Promise((resolve) => {
        loadAllowedUsers((users) => {
            allowedUsers = users;
            resolve();
        });
    });
}

function setupCommands(bot) {
    bot.start(async (ctx) => {
        await reloadAllowedUsers(); // Cargar usuarios permitidos al iniciar
        ctx.reply('¡Hola! Soy un bot de Telegram para automatizar las descripciones en tu canal.');
    });

    bot.command('permitir', async (ctx) => {
        await reloadAllowedUsers(); // Cargar usuarios permitidos antes de verificar

        if (ctx.message.from.id !== 7000966318) { // Cambia este ID por el correcto
            return ctx.reply('No tienes permiso para usar este comando.');
        }

        const userId = parseInt(ctx.message.text.split(' ')[1]);

        try {
            const user = await ctx.telegram.getChat(userId);

            if (!user) {
                return ctx.reply('No se pudo encontrar al usuario con el ID proporcionado.');
            }

            // Verificar si el usuario ya está permitido
            if (allowedUsers.includes(userId)) {
                return ctx.reply('Este usuario ya tiene permisos.');
            }

            saveAllowedUser({
                id: userId,
                first_name: user.first_name,
                last_name: user.last_name || '',
                username: user.username || ''
            });

            // Actualizar la lista de usuarios permitidos
            await reloadAllowedUsers(); // Recargar la lista después de agregar

            ctx.reply('Usuario permitido con éxito.');
        } catch (error) {
            console.error('Error al obtener la información del usuario:', error);
            ctx.reply('Hubo un error al intentar permitir al usuario.');
        }
    });

    bot.command('eliminar', async (ctx) => {
        await reloadAllowedUsers(); // Cargar usuarios permitidos antes de verificar

        if (ctx.message.from.id !== 7000966318) { // Cambia este ID por el correcto
            return ctx.reply('No tienes permiso para usar este comando.');
        }

        const userId = parseInt(ctx.message.text.split(' ')[1]);

        // Verificar si el usuario está permitido
        if (!allowedUsers.includes(userId)) {
            return ctx.reply('Este usuario no tiene permisos.');
        }

        deleteAllowedUser(userId, (success) => {
            if (success) {
                // Actualizar la lista de usuarios permitidos
                reloadAllowedUsers(); // Recargar la lista después de eliminar
                ctx.reply('Usuario eliminado con éxito.');
            } else {
                ctx.reply('Hubo un error al eliminar el usuario.');
            }
        });
    });

    // Otros comandos...

    bot.start((ctx) => {
        const firstName = ctx.message.from.first_name;
        ctx.reply(`¡Hola, ${firstName}! Soy tu bot de Telegram. ¿En qué puedo ayudarte hoy?`);
    });
    

    // Cargar la lista de usuarios permitidos al inicio
    reloadAllowedUsers();
}

module.exports = { setupCommands };