import TelegramBot from "node-telegram-bot-api";
import NodeCache from "node-cache";
import "dotenv/config";

import botCommands from "./src/botCommands.js";
import {
  handleRandomAnime,
  handleRandomAnimeh,
  handleTiktokDownloader,
  handleYoutubeDownload,
} from "./src/botHandlers.js";

const Bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const cache = new NodeCache({ stdTTL: 300 });
export { Bot, cache };

console.log("Bot ready");
Bot.setMyCommands(botCommands);
Bot.on("message", async (msg) => {
  const date = new Date();
  console.log(
    `LOG[${date.toDateString()}|${date.toLocaleTimeString()}]: "${
      msg.text
    }", from ${msg.from.first_name}, username ${msg.from.username}`
  );
});

// Random anime
Bot.onText(/^\/random_anime$/, handleRandomAnime);
Bot.onText(/^\/random_animeh$/, handleRandomAnimeh);

// Youtube downloader | /ytdl
Bot.onText(/^\/ytdl\s+(.+)$/, handleYoutubeDownload);
Bot.onText(
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/|ytshorts\.[^\/]+\/)([A-Za-z0-9_-]{11})/,
  handleYoutubeDownload
);
Bot.onText(/^\/ytdl$/, async (msg) => {
  try {
    await Bot.sendMessage(
      msg.chat.id,
      `
Harap masukkan parameter YT_URL.
Contoh: /ytdl https://www.youtube.com/watch?v=dQw4w9WgXcQ

Atau kamu juga bisa langsung <i>paste</i> link videonya tanpa command /ytdl
      `,
      {
        disable_web_page_preview: true,
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error("ERROR[/ytdl]:", error.message);
  }
});

Bot.onText(/^\/ttdl\s+(.+)$/, handleTiktokDownloader);
Bot.onText(
  /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+(?:\?[^\\s]*)?$|^https?:\/\/vt\.tiktok\.com\/[\w\d]+\/?$/,
  handleTiktokDownloader
);
Bot.onText(/^\/ttdl$/, async (msg) => {
  try {
    await Bot.sendMessage(
      msg.chat.id,
      `
Harap masukkan parameter TT_URL.
Contoh: /ttdl https://vt.tiktok.com/ZShjR3WrD/

Atau kamu juga bisa langsung <i>paste</i> link videonya tanpa command /ttdl
      `,
      {
        disable_web_page_preview: true,
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error("ERROR[/ytdl]:", error.message);
  }
});

Bot.onText(/^\/igdl\s+(.+)$/, async (msg, match) => {
  // const reelsRegex = "https?://(www.)?instagram.com/reels/([a-zA-Z0-9_-]+)/?";
  // const igURL = match[1].match(reelsRegex);

  // if (!igURL) {
  //   return;
  // }

  try {
    const loadingMessage = await Bot.sendMessage(msg.chat.id, "Tunggu ya...", {
      reply_to_message_id: msg.message_id,
    });
    const startTime = performance.now();
    const resp = await rs.igdl(match[1]);
    const endTime = performance.now();
    const url = resp.data[0].url;
    await Bot.sendMessage(
      msg.chat.id,
      `Harap di buka di <b>eksternal</b> browser seperti Chrome, Edge, Brave, Safari.
<i>${(endTime - startTime).toFixed(2)}ms</i>`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "Hold to copy", url }]],
        },
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML",
      }
    );
    await Bot.deleteMessage(loadingMessage.chat.id, loadingMessage.message_id);
  } catch (error) {
    console.log(error.message);
  }
});
