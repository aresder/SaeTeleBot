import { ytmp3, ytmp4 } from "@vreden/youtube_scraper";
import { Bot, cache } from "../main.js";
import { getAnime } from "./utils.js";

export async function handleRandomAnime(msg) {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  try {
    const loadingMessage = await Bot.sendMessage(chatId, "Tunggu ya...", {
      reply_to_message_id: messageId,
    });

    let startTime = null;
    let endTime = null;
    let data = null;

    try {
      startTime = performance.now();
      data = await getAnime("sfw");
      endTime = performance.now();
    } catch (error) {
      console.error(error.message);
      await Bot.sendMessage(
        chatId,
        "Gambarnya ga ada nih, coba lagi aja ya...",
        {
          reply_to_message_id: messageId,
        }
      );
      await Bot.deleteMessage(chatId, loadingMessage.message_id);
      return;
    }

    await Bot.sendPhoto(chatId, data?.url, {
      caption: `Ini bos ${msg.from.first_name} 😋 <i>${(
        endTime - startTime
      ).toFixed(2)}ms</i>`,
      reply_to_message_id: messageId,
      parse_mode: "HTML",
    });
    await Bot.deleteMessage(chatId, loadingMessage.message_id);
  } catch (error) {
    console.log(error.message);
    await Bot.sendMessage(
      userId,
      "Error nih, coba lagi ya...\nAdmin @aresder",
      {
        reply_to_message_id: userMsgId,
      }
    );
  }
}

export async function handleRandomAnimeh(msg) {
  const userId = msg.chat.id;
  const userMsgId = msg.message_id;

  try {
    const loadingMessage = await Bot.sendMessage(msg.chat.id, "Tunggu ya...", {
      reply_to_message_id: msg.message_id,
    });

    let startTime = null;
    let endTime = null;
    let data = null;

    try {
      startTime = performance.now();
      data = await getAnime("nsfw");
      endTime = performance.now();
    } catch (error) {
      console.error(error.message);
      await Bot.sendMessage(
        chatId,
        "Gambarnya ga ada nih, coba lagi aja ya...",
        {
          reply_to_message_id: messageId,
        }
      );
      await Bot.deleteMessage(chatId, loadingMessage.message_id);
      return;
    }

    await Bot.sendPhoto(userId, data?.url, {
      caption: `
Ini bos ${msg.from.first_name} 😋 <i>${(endTime - startTime).toFixed(2)}ms</i>
`,
      reply_to_message_id: userMsgId,
      parse_mode: "HTML",
    });
    await Bot.deleteMessage(loadingMessage.chat.id, loadingMessage.message_id);
  } catch (error) {
    console.log("Download error:", error.message);
    await Bot.sendMessage(
      userId,
      "Error nih, coba lagi ya...\nAdmin @aresder",
      {
        reply_to_message_id: userMsgId,
      }
    );
  }
}

export async function handleYoutubeDownload(msg, match) {
  const userId = msg.chat.id;
  const userMsgId = msg.message_id;
  const url = msg.link_preview_options?.url;
  const ytRegex =
    "(?:https?:\\/\\/)?(?:www\\.|m\\.)?(?:youtube\\.com\\/(?:watch\\?v=|embed\\/|shorts\\/)|youtu\\.be\\/|ytshorts\\.[^\\/]+\\/)([A-Za-z0-9_-]{11})";

  try {
    if (!url.match(ytRegex) || !url) {
      await Bot.sendMessage(userId, "Youtube URL tidak valid", {
        reply_to_message_id: userMsgId,
      });
      return;
    }

    const qualityOptions = await Bot.sendMessage(
      userId,
      `
Pilih quality video:
      `,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "360p", callback_data: "360" },
              { text: "480p", callback_data: "480" },
              { text: "720p", callback_data: "720" },
              { text: "1080p", callback_data: "1080" },
            ],
          ],
        },
        reply_to_message_id: userMsgId,
      }
    );

    Bot.on("callback_query", async (q) => {
      if (q.message.message_id !== qualityOptions.message_id) return;

      const quality = q.data;

      try {
        const processMsg = await Bot.sendMessage(
          userId,
          `Downloading... <i>${quality}p</i>`,
          {
            reply_to_message_id: userMsgId,
            parse_mode: "HTML",
          }
        );

        const cacheKey = `ytInfo:${url}:${quality}`;
        let mp4 = cache.get(cacheKey);

        if (!mp4) {
          console.log("kvnd");
          mp4 = await ytmp4(url, quality);
          cache.set(cacheKey, mp4);
        }

        // const startTime = performance.now();
        // const mp3 = await ytmp3(url);
        // const endTime = performance.now();
        // const respTime = (endTime - startTime).toFixed(2);

        await Bot.editMessageText(
          `
<b>Title</b>: ${mp4.metadata?.title.slice(0, 28) + "..." ?? "Tidak tersedia"}
<b>Author</b>: ${mp4.metadata?.author.name ?? "Tidak tersedia"}
<b>Views</b>: ${mp4.metadata?.views ?? "Tidak tersedia"}
<b>Quality</b>: ${mp4.download?.quality ?? "Tidak tersedia"}

          `,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "Mp4", url: mp4.download?.url },
                  // { text: "Mp3", url: mp3.download?.url },
                ],
              ],
            },
            chat_id: processMsg.chat.id,
            message_id: processMsg.message_id,
            parse_mode: "HTML",
          }
        );
      } catch (error) {
        console.error("Gagal download data:", error.message);
      }
    });
  } catch (error) {
    console.error("Inline keyboard:", error.message);
  }
}
