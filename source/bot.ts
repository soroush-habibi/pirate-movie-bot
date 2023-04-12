import grammy from 'grammy';
import 'dotenv/config';

import parse from './utils/parse.js';

if (!process.env.BOT_TOKEN) {
    process.exit(1);
}

const bot = new grammy.Bot(process.env.BOT_TOKEN);

bot.command("start", (ctx) => {
    ctx.reply("Hi.send a movie or show name:");
});

bot.on("message:text", async (ctx) => {
    const msg = await ctx.reply("Searching...");

    const sites = await parse.searchSites(ctx.message.text);

    if (sites.length === 0) {
        ctx.api.editMessageText(ctx.chat.id, msg.message_id, "Can not find movie");
    } else {
        const inlineKeyboard = new grammy.InlineKeyboard();

        for (let i of sites) {
            inlineKeyboard.text(i.name, "url:" + i.url);
        }

        await ctx.reply("Choose a site for download:", { reply_markup: inlineKeyboard });

        ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
    }
});

bot.callbackQuery(/url:(.+)/, async (ctx) => {
    const url = ctx.callbackQuery.data.slice(4);

    const links = await parse.getDownloadLinks(url);

    ctx.answerCallbackQuery();
})

bot.start();