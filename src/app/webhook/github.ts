import dotenv from "dotenv";
import { App } from "octokit";
import fs from "fs";
import http from "http";

dotenv.config();

const appId = process.env.APP_ID as string;
const webhookSecret = process.env.WEBHOOK_SECRET as string;
const privateKeyBase64 = process.env.PRIVATE_KEY as string;
const telegramToken = process.env.TELEGRAM_TOKEN as string;
const telegramChatId = process.env.TELEGRAM_CHAT as string;

const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf-8');

const app = new App({
  appId: appId,
  privateKey: privateKey,
  webhooks: {
    secret: webhookSecret,
  },
});

async function sendTelegramMessage(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        message_thread_id: 29,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Telegram API responded with ${response.status}`);
    }

    console.log("Message sent to Telegram.");
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
  }
}

interface StarEventPayload {
  action: string;
  repository: {
    full_name: string;
  };
  sender: {
    login: string;
  };
}

async function handleStarEvent({ payload }: { payload: StarEventPayload }): Promise<void> {
  if (payload.action === "created") {
    console.log(`New star event received for repository ${payload.repository.full_name}`);
    const telegramMessage = `The repository ${payload.repository.full_name} received a new star from ${payload.sender.login}! 🌟`;
    await sendTelegramMessage(telegramMessage);
  }
}

app.webhooks.on("star.created", handleStarEvent);

app.webhooks.onError((error: any) => {
  if (error.name === "AggregateError") {
    console.error(`Error processing request: ${error.event}`);
  } else {
    console.error(error);
  }
});