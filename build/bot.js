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
    try {
        const msg = await ctx.reply("Searching...");
        const sites = await parse.searchSites(ctx.message.text);
        if (sites.length === 0) {
            ctx.api.editMessageText(ctx.chat.id, msg.message_id, "Can not find movie");
        }
        else {
            const inlineKeyboard = new grammy.InlineKeyboard();
            for (let i of sites) {
                inlineKeyboard.text(i.name, "url:" + i.url);
            }
            await ctx.reply("Choose a site for download:", { reply_markup: inlineKeyboard });
            ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
        }
    }
    catch (e) {
        console.log(e);
    }
});
bot.callbackQuery(/^url:(.+)/, async (ctx) => {
    try {
        const url = ctx.callbackQuery.data.slice(4);
        const links = await parse.getDownloadLinks(url);
        if (links[0].season) {
            const set = new Set();
            links.map((value) => {
                if (value.season)
                    set.add(value.season);
            });
            const inlineKeyboard = new grammy.InlineKeyboard();
            set.forEach((i) => {
                const data = i + "url:" + url;
                inlineKeyboard.text(i, data);
            });
            await ctx.reply("choose a season:", { reply_markup: inlineKeyboard });
        }
        else {
            links.map(async (value) => {
                let message = value.label + ":" + "\n";
                message += value.urls.join("\n\n");
                message += "\n";
                try {
                    await ctx.reply(message);
                }
                catch (e) {
                    console.log(e);
                }
            });
        }
        await ctx.answerCallbackQuery();
    }
    catch (e) {
        console.log(e);
    }
});
bot.callbackQuery(/url:(.+)/, async (ctx) => {
    const url = ctx.callbackQuery.data.match(/url:(.+)/g)?.toString().slice(4);
    let season = "";
    if (url)
        season = ctx.callbackQuery.data.slice(0, ctx.callbackQuery.data.indexOf(url) - 4);
    try {
        if (url && season) {
            const links = await parse.getDownloadLinks(url);
            links.map(async (value) => {
                if (value.season === season) {
                    let message = value.label + ":" + "\n";
                    message += value.urls.join("\n\n");
                    message += "\n";
                    try {
                        await ctx.reply(message);
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
            });
        }
        await ctx.answerCallbackQuery();
    }
    catch (e) {
        console.log(e);
    }
});
bot.start();
