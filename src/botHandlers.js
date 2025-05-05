import { Bot } from "../main.js";
import {
  getAnime,
  getTiktokData,
  getYoutubeData,
  inlineKeyboardButtons,
} from "./utils.js";

async function getPhotoAnime(msg, type) {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  try {
    const loadingMessage = await Bot.sendMessage(chatId, "Tunggu ya...", {
      reply_to_message_id: messageId,
    });

    const startTime = performance.now();
    const data = await getAnime(type);
    const endTime = performance.now();

    await Bot.sendPhoto(chatId, data?.url, {
      caption: `Ini bos ${msg.from.first_name} 😋 <i>${(
        endTime - startTime
      ).toFixed(2)}ms</i>`,
      reply_to_message_id: messageId,
      parse_mode: "HTML",
    });
    await Bot.deleteMessage(chatId, loadingMessage.message_id);
  } catch (error) {
    console.error("ERROR[getAnime]", error.message);
    await Bot.sendMessage(chatId, "Gambarnya ga ada nih, coba lagi aja ya...", {
      reply_to_message_id: messageId,
    });
  }
}

export async function handleRandomAnime(msg) {
  await getPhotoAnime(msg, "sfw");
}

export async function handleRandomAnimeh(msg) {
  await getPhotoAnime(msg, "nsfw");
}

export async function handleYoutubeDownload(msg, match) {
  const userId = msg.chat.id;
  const userMsgId = msg.message_id;
  let url = match["input"];

  if (url.includes("/ytdl")) url = url.replace("/ytdl", "").trim();

  const ytRegex =
    "(?:https?:\\/\\/)?(?:www\\.|m\\.)?(?:youtube\\.com\\/(?:watch\\?v=|embed\\/|shorts\\/)|youtu\\.be\\/|ytshorts\\.[^\\/]+\\/)([A-Za-z0-9_-]{11})";

  // Memastikan bahwa URL yang diberikan adalah URL Youtube
  if (!url.match(ytRegex) || !url) {
    try {
      await Bot.sendMessage(userId, "Youtube URL tidak valid", {
        reply_to_message_id: userMsgId,
      });
    } catch (error) {
      console.error(`ERROR`, error.message);
    }
    return;
  }

  try {
    // Kirim button untuk memilih kualitas video
    const qualityOptions = await inlineKeyboardButtons(
      userId,
      userMsgId,
      "Pilih kualitas video",
      [
        { text: "360p", callback_data: "360" },
        { text: "480p", callback_data: "480" },
        { text: "720p", callback_data: "720" },
        { text: "1080p", callback_data: "1080" },
      ]
    );

    Bot.on("callback_query", async (q) => {
      // Cek apakah callback_query berasal dari pesan yang sama
      if (
        q.message.message_id !== qualityOptions.message_id ||
        q.from.id !== userId
      )
        return;

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

        const data = await getYoutubeData(url, quality);
        const mp4 = data.mp4;
        const mp3 = data.mp3;
        const respTime = data.respTime;

        const mp4Url = mp4.download?.url;
        const mp3Url = mp3.download?.url;

        const resultMessage = `
<b>Title</b>: ${
          mp4.metadata?.title
            ? mp4.metadata?.title.slice(0, 28) + "..."
            : "Tidak tersedia"
        }
<b>Author</b>: ${mp4.metadata?.author.name ?? "Tidak tersedia"}
<b>Views</b>: ${mp4.metadata?.views ?? "Tidak tersedia"}
<b>Quality</b>: ${mp4.download?.quality ?? "Tidak tersedia"}
<i>${respTime}</i>

${mp4Url ? "" : "Download video ngga tersedia nih :("}
${mp3Url ? "" : "Download audio ngga tersedia nih :("}
`;

        await Bot.editMessageText(resultMessage, {
          reply_markup: {
            inline_keyboard: [
              mp4Url ? [{ text: "Mp4", url: mp4Url }] : [],
              mp3Url ? [{ text: "Mp3", url: mp3Url }] : [],
            ],
          },
          chat_id: processMsg.chat.id,
          message_id: processMsg.message_id,
          parse_mode: "HTML",
        });
      } catch (error) {
        console.error("ERROR[Download data]:", error.message);
      }
    });
  } catch (error) {
    console.error("ERROR[Inline keyboard]:", error.message);
  }
}

export async function handleTiktokDownloader(msg, match) {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;
  let url = match["input"];

  if (url.includes("/ttdl")) url = url.replace("/ttdl", "").trim();

  const ttRegex =
    "https?:\\/\\/(www\\.)?tiktok\\.com\\/@[\\w.-]+\\/video\\/\\d+(\\?[^\\s]*)?|https?:\\/\\/vt\\.tiktok\\.com\\/[\\w\\d]+\\/?";

  if (!url || !url.match(ttRegex)) {
    try {
      await Bot.sendMessage(chatId, "Harap masukkan Tiktok URL yang valid", {
        reply_to_message_id: messageId,
      });
    } catch (error) {
      console.error("ERROR[check Tiktok URL]:", error.message);
    }
    return;
  }

  try {
    const loadingMessage = await Bot.sendMessage(chatId, "Downloading...", {
      reply_to_message_id: messageId,
    });
    const startTime = performance.now();
    const data = await getTiktokData(url);
    const endTime = performance.now();
    const respTime = (endTime - startTime).toFixed(2);

    if (data.title.length > 28) {
      data.title = data.title.slice(0, 28) + "...";
    }

    await Bot.editMessageText(
      `
<b>Title</b>: ${data?.title ?? "Tidak tersedia"}
<b>Author</b>: ${data?.author ?? "Tidak tersedia"}
<b>Username</b>: ${data?.username ?? "Tidak tersedia"}
<b>Views</b>: ${data?.views ?? "Tidak tersedia"}
<b>Comments</b>: ${data?.comment ?? "Tidak tersedia"}
<i>${respTime}ms</i>
      `,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Mp4", url: data?.video },
              { text: "Mp4 HD", url: data?.video_hd },
            ],
            [
              { text: "Mp4 WM", url: data?.video_wm },
              { text: "Mp3", url: data?.music },
            ],
          ],
        },
        chat_id: chatId,
        message_id: loadingMessage.message_id,
        parse_mode: "HTML",
      }
    );
  } catch (error) {
    console.error("ERROR[getTiktokData]:", error.message);
    await Bot.sendMessage(
      chatId,
      "Gagal download data video tiktok. Harap link tiktok sudah benar ya...",
      { reply_to_message_id: messageId }
    );
  }
}
