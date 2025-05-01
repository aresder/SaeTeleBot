import { cache } from "../main.js";

// Get random anime from api.nekosapi.com by rating/type photo
// Type: safe, suggestive, explicit
export function getAnime(type = "sfw") {
  return new Promise(async (resolve, reject) => {
    const categories = ["waifu", "neko"];
    const suffleCategory =
      categories[Math.floor(Math.random() * categories.length)];

    try {
      const resp = await fetch(
        `https://api.waifu.pics/${type}/${suffleCategory}`
      );

      if (!resp.ok) {
        return reject(new Error("Gambar tidak tersedia"));
      }

      const data = await resp.json();
      return resolve(data);
    } catch (error) {
      console.error("Gagal get data API:", error.message);
      return reject(new Error("Gagal get data API"));
    }
  });
}
