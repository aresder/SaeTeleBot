import Bot from "../main.js";

export async function handleRandomAnime(msg) {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  try {
    const loadingMessage = await Bot.sendMessage(chatId, "Tunggu ya...", {
      reply_to_message_id: msg.message_id,
    });
    const startTime = performance.now();
    const resp = await fetch("https://api.nekosapi.com/v4/images/random");
    const endTime = performance.now();
    const data = await resp.json();
    const safeUrls = data.filter((item) => item.rating == "safe");

    if (safeUrls.length < 1) {
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

    await Bot.sendPhoto(chatId, safeUrls[0].url, {
      caption: `Ini bos ${msg.from.first_name} 😋 <i>${(
        endTime - startTime
      ).toFixed(2)}ms</i>`,
      reply_to_message_id: messageId,
      parse_mode: "HTML",
    });
    await Bot.deleteMessage(chatId, loadingMessage.message_id);
  } catch (error) {
    console.log(error.message);
  }
}

export async function handleRandomAnimeh(msg) {
  try {
    const loadingMessage = await Bot.sendMessage(msg.chat.id, "Tunggu ya...", {
      reply_to_message_id: msg.message_id,
    });
    const startTime = performance.now();
    const resp = await fetch("https://api.nekosapi.com/v4/images/random");
    const endTime = performance.now();
    const data = await resp.json();
    const explicitUrls = data.filter((item) => item.rating == "explicit");

    if (explicitUrls.length < 1) {
      await Bot.sendMessage(
        msg.chat.id,
        "Gambar yang kamu mau ga ada nih. Coba lagi aja ya..."
      );
      await Bot.deleteMessage(
        loadingMessage.chat.id,
        loadingMessage.message_id
      );
      return;
    }

    await Bot.sendPhoto(msg.chat.id, explicitUrls[0].url, {
      caption: `
Ini bos ${msg.from.first_name} 😋 <i>${(endTime - startTime).toFixed(2)}ms</i>
`,
      reply_to_message_id: msg.message_id,
      parse_mode: "HTML",
    });
    await Bot.deleteMessage(loadingMessage.chat.id, loadingMessage.message_id);
  } catch (error) {
    console.log(error.message);
  }
}

export async function handleYoutubeDownload(msg, url, ytdl) {
  try {
    await Bot.sendMessage(msg.chat.id, "Pilih quality video:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "144p",
              callback_data: "144p",
            },
            {
              text: "240p",
              callback_data: "240p",
            },
            {
              text: "360p",
              callback_data: "360p",
            },
          ],
          [
            {
              text: "480p",
              callback_data: "480p",
            },
            {
              text: "720p",
              callback_data: "720p",
            },
            {
              text: "1080p",
              callback_data: "1080p",
            },
          ],
        ],
      },
      reply_to_message_id: msg.message_id,
    });

    Bot.once("callback_query", async (query) => {
      let quality = query.data;

      try {
        const downloadMessage = await Bot.sendMessage(
          msg.chat.id,
          `
Downloading... 🍳

<i>*Coba lagi jika tidak ada respon dalam 15 detik</i>
          `,
          {
            reply_to_message_id: msg.message_id,
            parse_mode: "HTML",
          }
        );

        await Bot.deleteMessage(
          query.message.chat.id,
          query.message.message_id
        );

        const startTime = performance.now();
        const videoInfo = await ytdl.getInfo(url);
        const endTime = performance.now();

        // const dl = ytdl.downloadFromInfo(videoInfo);
        // await Bot.sendVideo(msg.chat.id, dl);
        // return;

        const mp3Filter = videoInfo.formats.filter(
          (item) =>
            (item.mimeType.includes("audio/mp4") &&
              item.audioQuality == "AUDIO_QUALITY_MEDIUM") ||
            item.mimeType.includes("audio/webm")
        );
        const mp4Filter = videoInfo.formats.filter(
          (item) =>
            item.mimeType.includes("video/mp4") && item.qualityLabel == quality
        );

        let videoDownload = true;
        let audioDownload = true;

        if (mp4Filter.length < 1) videoDownload = false;
        if (mp3Filter.length < 1) audioDownload = false;

        const { title, viewCount, likes, author } = videoInfo.videoDetails;

        await Bot.editMessageText(
          `
Title: <b>${title.length >= 24 ? title.slice(0, 24) + "..." : title}</b>
Author: <b>${author.name}</b>
Quality: ${videoDownload ? `<b>${mp4Filter[0].qualityLabel}</b>` : null}
Views: <b>${viewCount}</b>
Likes: <b>${likes}</b>
<i>${(endTime - startTime).toFixed(2)}ms</i>

<i>*Jika link download bermasalah, harap coba versi /ytdl_v2</i>

${videoDownload ? "" : `Maaf nih, video quality ${quality} nya ngga ada :(`}
${audioDownload ? "" : "Maaf nih, audio downloadnya ngga ada :("}
    `,
          {
            reply_markup: {
              inline_keyboard: [
                videoDownload
                  ? [{ text: "Mp4 download", url: mp4Filter[0].url }]
                  : [],
                audioDownload
                  ? [
                      { text: "Mp3 V1", url: mp3Filter[0].url },
                      {
                        text: "Mp3 V2",
                        url: mp3Filter[mp3Filter.length - 1].url,
                      },
                      {
                        text: "Mp3 V3",
                        url: mp3Filter[mp3Filter.length - 2].url,
                      },
                    ]
                  : [],
              ],
            },
            chat_id: downloadMessage.chat.id,
            message_id: downloadMessage.message_id,
            parse_mode: "HTML",
          }
        );
      } catch (error) {
        console.error("Error from callback query:", error.message);
        await Bot.sendMessage(
          msg.chat.id,
          `Error, Coba lagi. \nAdmin: @aresder0`
        );
      }
    });
  } catch (error) {
    console.error("Error from select quality:", error.message);
    await Bot.sendMessage(msg.chat.id, "Error, Coba lagi. \nAdmin: @aresder0");
  }
}
