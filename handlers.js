// handlers.js

const { loadAllowedUsers, incrementPhotoCount, incrementVideoCount, incrementGifCount } = require('./utils');

let allowedUsers = [];

function setupHandlers(bot) {
    loadAllowedUsers((users) => {
        allowedUsers = users;
    });

    const processedMediaGroups = new Set();  // Set to keep track of processed media groups

    bot.on('message', async (ctx) => {
        try {
            const message = ctx.message;

            if (!allowedUsers.includes(message.from.id)) {
                return ctx.reply('No tienes permiso para usar este bot.');
            }

            if (message.media_group_id) {
                if (processedMediaGroups.has(message.media_group_id)) {
                    return;  // Ignore already processed media group
                }

                processedMediaGroups.add(message.media_group_id);  // Add to processed set

                const mediaGroup = await getMediaGroup(ctx);
                if (mediaGroup.length > 0) {
                    await processMediaGroup(ctx, mediaGroup);
                }
            } else {
                const file = {
                    type: getFileType(message),
                    file_id: getFileId(message),
                    caption: getCaption(),
                    user: message.from
                };

                if (file.file_id) {
                    await processFile(ctx, file);
                }
            }

        } catch (error) {
            console.error('Error no controlado al procesar el mensaje', ctx.update);
            console.error(error);
        }
    });
}

function getFileType(message) {
    if (message.photo) {
        return 'photo';
    } else if (message.video) {
        return 'video';
    } else if (message.animation) {
        return 'animation';
    }
    return null;
}

function getFileId(message) {
    if (message.photo) {
        return message.photo[message.photo.length - 1].file_id;
    } else if (message.video) {
        return message.video.file_id;
    } else if (message.animation) {
        return message.animation.file_id;
    }
    return null;
}

function getCaption() {
    return `
🎋 | <a href="https://t.me/NeoTokioDesc">Descripción</a> - <a href="https://t.me/+5OZ9vjz9Ko5jMGMx">Grupo</a> - <a href="https://t.me/NeoTokioBackup">Backup</a> - <a href="https://t.me/boost/NeoTokio">Booster</a>
    `;
}

async function processFile(ctx, file) {
    const mediaItem = {
        type: file.type,
        media: file.file_id,
        caption: file.caption,
        parse_mode: 'HTML'
    };

    try {
        await ctx.telegram.sendMediaGroup(process.env.CANAL_ID, [mediaItem]);

        // Incrementar contador de estadísticas para el usuario
        incrementCounter(file);

        console.log('Archivo reenviado al canal con descripción personalizada');
    } catch (error) {
        console.error('Error al enviar el archivo al canal:', error);
    }
}

async function processMediaGroup(ctx, mediaGroup) {
    try {
        const mediaItems = mediaGroup.map((media, index) => ({
            type: getFileType(media),
            media: getFileId(media),
            caption: index === 0 ? getCaption() : undefined,  // Solo la primera tiene la descripción
            parse_mode: 'HTML'
        }));

        await ctx.telegram.sendMediaGroup(process.env.CANAL_ID, mediaItems);

        // Incrementar contadores de estadísticas para cada usuario
        mediaGroup.forEach(media => {
            const user = media.from || ctx.message.from;
            const file = {
                type: getFileType(media),
                file_id: getFileId(media),
                user: user
            };
            incrementCounter(file);
        });

        console.log('Grupo de archivos reenviado al canal con descripción personalizada');
    } catch (error) {
        console.error('Error al enviar el grupo de archivos al canal:', error);
    }
}

function incrementCounter(file) {
    const { user, type } = file;
    const userData = {
        firstName: user.first_name,
        lastName: user.last_name || '',
        username: user.username || ''
    };

    if (type === 'photo') {
        incrementPhotoCount(user.id, userData);
    } else if (type === 'video') {
        incrementVideoCount(user.id, userData);
    } else if (type === 'animation') {
        incrementGifCount(user.id, userData);
    }
}

async function getMediaGroup(ctx) {
    try {
        const groupId = ctx.message.media_group_id;
        const chatId = ctx.message.chat.id;

        // Obtener mensajes recientes del chat
        const messages = await ctx.telegram.getUpdates({
            allowed_updates: ['message']
        });

        // Filtrar los mensajes que pertenecen al mismo grupo de medios
        const mediaGroupMessages = messages
            .map(update => update.message)
            .filter(msg => msg && msg.chat.id === chatId && msg.media_group_id === groupId);

        return mediaGroupMessages;
    } catch (error) {
        console.error('Error en getMediaGroup', error);
        return [];
    }
}

module.exports = { setupHandlers };
