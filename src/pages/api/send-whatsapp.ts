// Next.js API route for sending WhatsApp messages
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  success: boolean;
  message: string;
  result?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ success: false, message: "Text is required" });
      return;
    }

    await fetch(
      `https://api.callmebot.com/whatsapp.php?phone=201287666534&text=${text}&apikey=8877258`,
    );

    await fetch(
      `https://api.callmebot.com/whatsapp.php?phone=201224002612&text=${text}&apikey=7135209`,
    );

    res.status(200).json({
      success: true,
      message: "WhatsApp message sent successfully",
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    res.status(200).json({
      success: false,
      message: "Failed to send WhatsApp message",
    });
  }
}
