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

        parse.availableSites(ctx.message.text).then(async (sites) => {
            if (sites.length === 0) {
                ctx.api.editMessageText(ctx.chat.id, msg.message_id, "Can not find movie");
            } else {
                const digiInlineKeyboard = new grammy.InlineKeyboard();

                let digiMessage = "Digimovie search results:\n\n";
                let digiCount = 0;
                for (let i of sites) {
                    if (i.name === "digimovie") {
                        digiCount++;
                        digiMessage += String(digiCount) + " - " + i.title + "\n";

                        digiInlineKeyboard.text(String(digiCount), "digi:" + digiCount + " - " + ctx.message.text);
                    }
                }

                if (digiInlineKeyboard.inline_keyboard.length > 0) {
                    await ctx.reply(digiMessage, { reply_markup: digiInlineKeyboard });
                }

                ctx.api.deleteMessage(ctx.chat.id, msg.message_id);
            }
        });
    } catch (e) {
        console.log(e);
    }
});

bot.callbackQuery(/^digi:[1-5] - (.)+/, async (ctx) => {
    try {
        const waitMessage = await ctx.reply("Please wait...");
        await ctx.answerCallbackQuery();

        const number = Number(ctx.callbackQuery.data.slice(5, 6));
        parse.availableSites(ctx.callbackQuery.data.slice(9)).then(async (sites) => {
            let url: string | undefined;

            let count = 0;
            for (let i of sites) {
                if (i.name === "digimovie") {
                    count++;
                }

                if (count === number) {
                    url = i.url;
                }
            }

            if (url) {
                await parse.getDownloadLinks(url).then(async (links) => {
                    if (links[0].season) {
                        const set: Set<string> = new Set();

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
                    } else {
                        links.map(async (value) => {
                            let message = value.label + ":" + "\n";
                            message += value.urls.join("\n\n");
                            message += "\n";

                            try {
                                await ctx.reply(message);
                            } catch (e) {
                                console.log(e);
                            }
                        });
                    }

                    if (ctx.chat)
                        ctx.api.deleteMessage(ctx.chat.id, waitMessage.message_id);
                });
            }
        });
    } catch (e) {
        console.log(e);
    }
});

bot.callbackQuery(/url:(.+)/, async (ctx) => {
    const url = ctx.callbackQuery.data.match(/url:(.+)/g)?.toString().slice(4);
    let season: string = "";
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
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
        }

        await ctx.answerCallbackQuery();
    } catch (e) {
        console.log(e);
    }
});

bot.start();