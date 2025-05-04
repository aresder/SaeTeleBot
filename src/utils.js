import { Bot } from "../main.js";
import rs from "ruhend-scraper";

// Get random anime from api.waifu.pics by rating/type photo
// type = sfw or nsfw
export async function getAnime(type = "sfw") {
  const categories = ["waifu", "neko"];
  const suffleCategory =
    categories[Math.floor(Math.random() * categories.length)];

  try {
    const resp = await fetch(
      `https://api.waifu.pics/${type}/${suffleCategory}`
    );

    if (!resp.ok) {
      throw new Error("Gambar tidak tersedia");
    }

    const data = await resp.json();
    return data;
  } catch (error) {
    console.error("Gagal mengambil data API:", error.message);
    throw new Error("Gagal mengambil data API");
  }
}

export async function getTiktokData(url) {
  try {
    const ttdl = await rs.ttdl(url);
    return ttdl;
  } catch (error) {
    console.error("ERROR[getTiktokData]:", error.message);
    throw new Error("Gagal mengambil data Tiktok");
  }
}

// Inline keyboard buttons
// chatId = id chat (chat.id), messageId = id message (message_id), text = string, buttons = array of object { text: string, callback_data: string }
export async function inlineKeyboardButtons(
  chatId,
  messageId,
  message = "",
  buttons = [{ text: "", callback_data: "" }] // text = string, callback_data = string
) {
  if (!Array.isArray(buttons) || buttons.length === 0)
    throw new Error(
      "ERROR[Inline keyboard]: Parameter buttons(array of object) wajib diisi"
    );

  buttons.forEach((button) => {
    if (!button.text || !button.callback_data) {
      throw new Error(
        "ERROR[Inline keyboard]: Parameter text dan callback_data wajib diisi"
      );
    }
    if (
      typeof button.text !== "string" ||
      typeof button.callback_data !== "string"
    ) {
      throw new Error(
        "ERROR[Inline keyboard]: Parameter text dan callback_data harus bertipe string"
      );
    }
  });

  try {
    return await Bot.sendMessage(chatId, message, {
      reply_markup: {
        inline_keyboard: [buttons],
      },
      reply_to_message_id: messageId,
    });
  } catch (error) {
    console.error("ERROR[Inline keyboard]:", error.message);
    throw new Error("ERROR[Inline keyboard]: Gagal mengirim inline keyboard");
  }
}
