import TelegramBot from "node-telegram-bot-api";
import OpenAI from "openai";
import path from "path";
import "dotenv/config";

// Tarot cards
const cards = [
  {
    name: "The Debugging Diva",
    description:
      "Triumph over challenges, discovering hidden issues, patience paying off",
    image: "debugging_diva.jpeg",
  },
  {
    name: "The PR Queen",
    description:
      "Harmonious collaboration, insightful feedback, a successful merge",
    image: "pr_queen.jpeg",
  },
];

const bot = new TelegramBot(process.env.BOT_KEY, { polling: true });
const client = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// Select a random card
function getRandomCard() {
  return cards[Math.floor(Math.random() * cards.length)];
}

async function getCardInterpretation(cardName, cardDescription, question) {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "developer",
          content: `You are a tarot expert. Provide an interpretation for the tarot card with name "${cardName}" and description "${cardDescription}" in response to the question: "${question}".`,
        },
      ],
      model: "gpt-3.5-turbo",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error fetching interpretation:", error);
    return "Sorry, I could not generate an interpretation at this time.";
  }
}

// Start command handler
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "Welcome to the Tarot Bot for Developers! Click the button below to get your reading.",
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "One-Card Reading", callback_data: "one_card_reading" }],
        ],
      },
    }
  );
});

// Button click handler
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === "one_card_reading") {
    bot.sendMessage(chatId, "What is your question for the tarot?");

    bot.once("message", async (msg) => {
      const question = msg.text;
      const card = getRandomCard();

      const interpretation = await getCardInterpretation(
        card.name,
        card.description,
        question
      );

      const cardImagePath = path.join("images", card.image);
      bot.sendPhoto(chatId, cardImagePath, {
        caption: `Your card: ${card.name}\n\n${interpretation}`,
      });
    });
  }
});

console.log("App is running...");
