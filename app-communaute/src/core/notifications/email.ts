/**
 * ENVOI D'E-MAILS
 *
 * - Si SMTP_URL est renseigné (voir .env.example), le message est envoyé par le
 *   fournisseur d'e-mails configuré (protocole standard SMTP).
 * - Sinon, il est écrit dans le dossier « emails » du dossier de données : pratique
 *   pour essayer l'application sans rien envoyer.
 */
import fs from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { ensureDataDir } from "@/core/config/installation";

export type EmailMessage = { to: string; subject: string; text: string };

export function emailIsConfigured(): boolean {
  return Boolean(process.env.SMTP_URL?.trim());
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const smtpUrl = process.env.SMTP_URL?.trim();
  const from = process.env.MAIL_FROM?.trim() || "ne-pas-repondre@localhost";

  if (smtpUrl) {
    const transport = nodemailer.createTransport(smtpUrl);
    await transport.sendMail({ from, to: message.to, subject: message.subject, text: message.text });
    return;
  }

  const folder = ensureDataDir("emails");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const recipient = message.to.replace(/[^a-zA-Z0-9@._-]/g, "_");
  const content = `De : ${from}\nÀ : ${message.to}\nObjet : ${message.subject}\n\n${message.text}\n`;
  await fs.writeFile(path.join(folder, `${stamp}_${recipient}.txt`), content, "utf8");
}
