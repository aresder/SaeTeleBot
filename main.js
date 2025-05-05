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
import { instagramGetUrl } from "instagram-url-direct";
import { igdl } from "ruhend-scraper";
import OpenAI from "openai";

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

// Tiktok downloader | /ttdl
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

import { InferenceClient } from "@huggingface/inference";
Bot.onText(/^\/ai\s+(.+)$/, async (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  const loadingMessage = await Bot.sendMessage(
    chatId,
    "AI sedang memproses...",
    {
      reply_to_message_id: messageId,
    }
  );
  const loadingMessages = [
    "AI sedang mencari",
    "AI sedang berpikir",
    "AI sedang memproses",
    "AI sedang menganalisis",
    "AI sedang meneliti",
    "AI sedang memikirkan jawaban",
    "AI sedang mencari jawaban",
  ];
  let dotCount = 0;
  let dots = "";
  let suffledMessage =
    loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

  const updateLoadingText = async () => {
    try {
      await Bot.editMessageText(`${suffledMessage}${dots}`, {
        chat_id: loadingMessage.chat.id,
        message_id: loadingMessage.message_id,
      });
    } catch (error) {}
  };

  const dotsIntervalId = setInterval(async () => {
    dotCount = (dotCount + 1) % 4;
    dots = ".".repeat(dotCount);
    await updateLoadingText();
  }, 500);

  const loadingMessageIntervalId = setInterval(async () => {
    suffledMessage =
      loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    await updateLoadingText();
  }, 6000);

  const client = new InferenceClient("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");

  try {
    const chatCompletion = await client.chatCompletion({
      provider: "novita",
      model: "Qwen/Qwen3-235B-A22B",
      messages: [
        {
          role: "user",
          content: msg.text.replace("/t", "").trim(),
        },
      ],
      // max_tokens: 512,
      temperature: 0.3,
    });

    const data = chatCompletion.choices[0].message;
    let text = data.content
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/[*#]/g, "")
      .trim();
    const MAX_CHARs = 4096;

    while (text.length > 0) {
      let chunk = text.slice(0, MAX_CHARs);

      let splitIndex = chunk.lastIndexOf(". ");
      if (splitIndex === -1) {
        splitIndex = chunk.lastIndexOf(" ");
      }

      if (splitIndex === -1 || splitIndex < MAX_CHARs * 0.5) {
        splitIndex = MAX_CHARs;
      }

      const messagePart = text.slice(0, splitIndex).trim();
      await Bot.sendMessage(chatId, messagePart, {
        reply_to_message_id: messageId,
      });

      text = text.slice(splitIndex).trim();
    }
  } catch (error) {
    console.error("ERROR[send message]:", error.message);
    await Bot.sendMessage(
      msg.chat.id,
      "Textnya tidak bisa di generate nih. Coba lagi ya...",
      {
        reply_to_message_id: msg.message_id,
      }
    );
  } finally {
    clearInterval(dotsIntervalId);
    clearInterval(loadingMessageIntervalId);
    await Bot.deleteMessage(loadingMessage.chat.id, loadingMessage.message_id);
  }
});
Bot.onText(/^\/ai$/, async (msg) => {
  try {
    await Bot.sendMessage(
      msg.chat.id,
      `
Hai saya asisten AI yang bisa menjawab pertanyaan kamu.
Masukan perintah seperti: <b>/ai siapakah penemu telepon?</b> ya jika ingin bertanya.
      `,
      {
        reply_to_message_id: msg.message_id,
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error("ERROR[/ai]:", error.message);
  }
});

// Bot.onText(/^\/igdl\s+(.+)$/, async (msg, match) => {
//   // const reelsRegex = "https?://(www.)?instagram.com/reels/([a-zA-Z0-9_-]+)/?";
//   // const igURL = match[1].match(reelsRegex);

//   // if (!igURL) {
//   //   return;
//   // }

//   try {
//     const loadingMessage = await Bot.sendMessage(msg.chat.id, "Tunggu ya...", {
//       reply_to_message_id: msg.message_id,
//     });
//     const startTime = performance.now();
//     const resp = await rs.igdl(match[1]);
//     const endTime = performance.now();
//     const url = resp.data[0].url;
//     await Bot.sendMessage(
//       msg.chat.id,
//       `Harap di buka di <b>eksternal</b> browser seperti Chrome, Edge, Brave, Safari.
// <i>${(endTime - startTime).toFixed(2)}ms</i>`,
//       {
//         reply_markup: {
//           inline_keyboard: [[{ text: "Hold to copy", url }]],
//         },
//         reply_to_message_id: msg.message_id,
//         parse_mode: "HTML",
//       }
//     );
//     await Bot.deleteMessage(loadingMessage.chat.id, loadingMessage.message_id);
//   } catch (error) {
//     console.log(error.message);
//   }
// });
