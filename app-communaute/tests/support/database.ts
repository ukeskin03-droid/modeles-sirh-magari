import { db } from "@/core/db/client";

/** Vide toutes les tables, pour repartir d'une base propre entre deux tests. */
export async function resetDatabase(): Promise<void> {
  const client = db();
  await client.contentLink.deleteMany();
  await client.quiz.deleteMany();
  await client.question.deleteMany();
  await client.notification.deleteMany();
  await client.job.deleteMany();
  await client.activityEvent.deleteMany();
  await client.groupMember.deleteMany();
  await client.group.deleteMany();
  await client.invitation.deleteMany();
  await client.session.deleteMany();
  await client.account.deleteMany();
  await client.loginAttempt.deleteMany();
  await client.user.deleteMany();
  await client.category.deleteMany();
  await client.media.deleteMany();
  await client.moduleState.deleteMany();
  await client.community.deleteMany();
}
