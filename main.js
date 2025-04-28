import TelegramBot from "node-telegram-bot-api";
import "dotenv/config";

import botCommands from "./src/botCommands.js";
import {
  handleRandomAnime,
  handleRandomAnimeh,
  handleYoutubeDownload,
} from "./src/botHandlers.js";
import ytdl from "@distube/ytdl-core";
import rs from "ruhend-scraper";

const Bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
export default Bot;

console.log("Bot ready");
Bot.setMyCommands(botCommands);
Bot.on("message", async (msg) => {
  console.log(
    `Chat "${msg.text}" from ${msg.from.first_name} with username ${msg.from.username}`
  );
});

Bot.onText(/^\/random_anime$/, handleRandomAnime);
Bot.onText(/^\/random_animeh$/, handleRandomAnimeh);

Bot.onText(
  /^(https?:\/\/)?(www\.youtube\.com|youtu\.be)\/.+$/,
  async (msg, match) => {
    try {
      await handleYoutubeDownload(msg, match[0], ytdl);
    } catch (error) {
      console.log(error.message);
    }
  }
);

Bot.onText(/^\/ytdl_v1$|ytdl_v2$/, async (msg) => {
  await Bot.sendMessage(
    msg.chat.id,
    `Harap masukkan parameter URL.
Contoh: /ytdl_v1 https://www.youtube.com/watch?v=dQw4w9WgXcQ

Atau kamu juga bisa langsung <i>paste</i> link videonya tanpa command /ytdl_v1
`,
    {
      disable_web_page_preview: true,
      reply_to_message_id: msg.message_id,
      parse_mode: "HTML",
    }
  );
});

Bot.onText(/^\/ytdl_v1\s+(.+)$/, async (msg, match) => {
  const ytRegex = "^(https?://)?(www.youtube.com|youtu.?be)/.+$";
  const ytUrl = match[1].match(ytRegex);

  if (!ytUrl) {
    await Bot.sendMessage(
      msg.chat.id,
      "Harap masukkan url youtube yang valid",
      {
        reply_to_message_id: msg.message_id,
      }
    );
    return;
  }

  await handleYoutubeDownload(msg, match[1], ytdl);
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

Bot.onText(/^\/ytdl_v2\s+(.+)$/, async (msg, match) => {
  const userId = msg.chat.id;
  const url = match[1];

  const ytRegex = "^(https?://)?(www.youtube.com|youtu.?be)/.+$";
  const ytUrl = match[1].match(ytRegex);

  if (!ytUrl) {
    await Bot.sendMessage(userId, "Harap masukkan url youtube yang valid", {
      reply_to_message_id: msg.message_id,
    });
    return;
  }

  const downloadMessage = await Bot.sendMessage(
    userId,
    `
Downloading... 🍳

<i>*Kecepatan download tergantung internet kamu</i>`,
    {
      reply_to_message_id: msg.message_id,
      parse_mode: "HTML",
    }
  );

  try {
    const startTime = performance.now();
    const mp4 = await rs.ytmp4(url);
    const mp3 = await rs.ytmp3(url);
    const endTime = performance.now();

    await Bot.editMessageText(
      `
Title: <b>${mp4.title.slice(0, 24)}...</b>
Author: <b>${mp4.author}</b>
Quality: <b>${mp4.quality}</b>
Views: <b>${mp4.views}</b>
<i>${(endTime - startTime).toFixed(2)}ms</i>
      `,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Mp4", url: mp4.video },
              { text: "Mp3", url: mp3.audio_2 },
            ],
          ],
        },
        chat_id: downloadMessage.chat.id,
        message_id: downloadMessage.message_id,
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error("Error from ytdl_v2:", error.message);
  }
});
