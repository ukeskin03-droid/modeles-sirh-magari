/**
 * COMPTES ET CONNEXION — mots de passe, sessions, invitations, règles sur les rôles.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { hashPassword, isPasswordAcceptable, verifyPassword } from "@/core/auth/password";
import { cleanupAuthData, createSession, deleteSession, findSession, setPreviewAsReader } from "@/core/auth/sessions";
import {
  acceptInvitation,
  authenticate,
  changeUserRole,
  createFirstAdmin,
  createInvitation,
  createInvitedUser,
  findInvitation,
  setUserActive,
} from "@/core/auth/users";
import { db } from "@/core/db/client";
import { resetDatabase } from "./support/database";

const PASSWORD = "un-mot-de-passe-solide";

beforeEach(resetDatabase);

describe("mots de passe", () => {
  it("ne sont jamais enregistrés en clair, et se vérifient", async () => {
    const hash = await hashPassword(PASSWORD);
    expect(hash).not.toContain(PASSWORD);
    expect(await verifyPassword(PASSWORD, hash)).toBe(true);
    expect(await verifyPassword("autre-mot-de-passe", hash)).toBe(false);
    expect(await verifyPassword(PASSWORD, null)).toBe(false);
    expect(await verifyPassword(PASSWORD, "valeur-abimee")).toBe(false);
  });

  it("deux empreintes du même mot de passe sont différentes", async () => {
    expect(await hashPassword(PASSWORD)).not.toBe(await hashPassword(PASSWORD));
  });

  it("doivent être assez longs", () => {
    expect(isPasswordAcceptable("court")).toBe(false);
    expect(isPasswordAcceptable(PASSWORD)).toBe(true);
  });
});

describe("premier compte", () => {
  it("est administrateur, et ne peut être créé qu'une fois", async () => {
    const id = await createFirstAdmin({ name: "Première Personne", email: "  Admin@Exemple.test ", password: PASSWORD });
    const user = await db().user.findUniqueOrThrow({ where: { id } });
    expect(user.role).toBe("admin");
    expect(user.email).toBe("admin@exemple.test");
    await expect(createFirstAdmin({ name: "Intrus", email: "intrus@exemple.test", password: PASSWORD })).rejects.toMatchObject({
      reason: "already-installed",
    });
  });
});

describe("sessions", () => {
  it("retrouvent la personne connectée, puis disparaissent à la déconnexion", async () => {
    const id = await createFirstAdmin({ name: "A", email: "a@exemple.test", password: PASSWORD });
    const { token } = await createSession(id);
    expect((await findSession(token))?.user.email).toBe("a@exemple.test");
    expect(await findSession("jeton-invente")).toBeNull();
    expect(await findSession(undefined)).toBeNull();

    // En base, seule l'empreinte du jeton est conservée.
    expect((await db().session.findMany()).some((session) => session.tokenHash === token)).toBe(false);

    await deleteSession(token);
    expect(await findSession(token)).toBeNull();
  });

  it("expirent", async () => {
    const id = await createFirstAdmin({ name: "A", email: "a@exemple.test", password: PASSWORD });
    const { token } = await createSession(id);
    await db().session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await findSession(token)).toBeNull();
    expect(await db().session.count()).toBe(0);
  });

  it("portent le mode « aperçu lecteur »", async () => {
    const id = await createFirstAdmin({ name: "A", email: "a@exemple.test", password: PASSWORD });
    const { token } = await createSession(id);
    const session = await findSession(token);
    await setPreviewAsReader(session!.sessionId, true);
    expect((await findSession(token))?.previewAsReader).toBe(true);
  });

  it("le ménage supprime les sessions expirées", async () => {
    const id = await createFirstAdmin({ name: "A", email: "a@exemple.test", password: PASSWORD });
    await createSession(id);
    await createSession(id);
    await db().session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await createSession(id);
    await cleanupAuthData();
    expect(await db().session.count()).toBe(1);
  });
});

describe("invitations", () => {
  it("permettent de choisir son mot de passe, une seule fois", async () => {
    const { userId, token } = await createInvitedUser({ name: "Invitée", email: "invitee@exemple.test", role: "reader" });
    // Tant que le mot de passe n'est pas choisi, la connexion est impossible.
    expect((await authenticate("invitee@exemple.test", "")).status).toBe("invalid");
    expect((await findInvitation(token))?.userId).toBe(userId);

    expect(await acceptInvitation(token, PASSWORD)).toBe(userId);
    expect((await authenticate("invitee@exemple.test", PASSWORD)).status).toBe("ok");

    // Le lien ne sert qu'une fois.
    expect(await findInvitation(token)).toBeNull();
    expect(await acceptInvitation(token, "autre-mot-de-passe")).toBeNull();
    expect((await authenticate("invitee@exemple.test", PASSWORD)).status).toBe("ok");
  });

  it("expirent", async () => {
    const { token } = await createInvitedUser({ name: "Invité", email: "invite@exemple.test", role: "reader" });
    await db().invitation.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await findInvitation(token)).toBeNull();
  });

  it("un nouveau lien rend l'ancien inutilisable et ferme les sessions ouvertes", async () => {
    const { userId, token } = await createInvitedUser({ name: "Invité", email: "invite@exemple.test", role: "editor" });
    await acceptInvitation(token, PASSWORD);
    const session = await createSession(userId);

    const first = await createInvitation(userId);
    const second = await createInvitation(userId);
    expect(await findInvitation(first)).toBeNull();
    expect(await acceptInvitation(second, "nouveau-mot-de-passe")).toBe(userId);
    expect(await findSession(session.token)).toBeNull();
    expect((await authenticate("invite@exemple.test", PASSWORD)).status).toBe("invalid");
    expect((await authenticate("invite@exemple.test", "nouveau-mot-de-passe")).status).toBe("ok");
  });

  it("refusent une adresse déjà utilisée, une adresse invalide ou un rôle inconnu", async () => {
    await createInvitedUser({ name: "A", email: "a@exemple.test", role: "reader" });
    await expect(createInvitedUser({ name: "B", email: "A@exemple.test", role: "reader" })).rejects.toMatchObject({ reason: "email-taken" });
    await expect(createInvitedUser({ name: "C", email: "pas-une-adresse", role: "reader" })).rejects.toMatchObject({ reason: "invalid-email" });
    await expect(createInvitedUser({ name: "D", email: "d@exemple.test", role: "chef" })).rejects.toMatchObject({ reason: "invalid-role" });
    await expect(createInvitedUser({ name: " ", email: "e@exemple.test", role: "reader" })).rejects.toMatchObject({ reason: "invalid-name" });
  });
});

describe("connexion", () => {
  it("se bloque après trop d'essais, même avec le bon mot de passe ensuite", async () => {
    await createFirstAdmin({ name: "A", email: "a@exemple.test", password: PASSWORD });
    for (let attempt = 0; attempt < 8; attempt++) {
      expect((await authenticate("a@exemple.test", "mauvais")).status).toBe("invalid");
    }
    expect((await authenticate("a@exemple.test", PASSWORD)).status).toBe("locked");
  });

  it("répond de la même façon pour un compte inconnu", async () => {
    expect((await authenticate("inconnu@exemple.test", PASSWORD)).status).toBe("invalid");
  });
});

describe("règles sur les comptes", () => {
  it("il reste toujours au moins un administrateur actif", async () => {
    const adminId = await createFirstAdmin({ name: "Admin", email: "admin@exemple.test", password: PASSWORD });
    const { userId: otherId } = await createInvitedUser({ name: "Autre", email: "autre@exemple.test", role: "admin" });

    // Le second administrateur ne peut ni rétrograder ni désactiver le dernier… tant qu'il est seul actif.
    await setUserActive(otherId, false, adminId);
    await expect(changeUserRole(adminId, "reader", otherId)).rejects.toMatchObject({ reason: "last-admin" });
    await expect(setUserActive(adminId, false, otherId)).rejects.toMatchObject({ reason: "last-admin" });

    // Avec deux administrateurs actifs, c'est possible.
    await setUserActive(otherId, true, adminId);
    await changeUserRole(adminId, "editor", otherId);
    expect((await db().user.findUniqueOrThrow({ where: { id: adminId } })).role).toBe("editor");
  });

  it("on ne modifie pas son propre compte", async () => {
    const adminId = await createFirstAdmin({ name: "Admin", email: "admin@exemple.test", password: PASSWORD });
    await expect(changeUserRole(adminId, "reader", adminId)).rejects.toMatchObject({ reason: "self-change" });
    await expect(setUserActive(adminId, false, adminId)).rejects.toMatchObject({ reason: "self-change" });
  });

  it("désactiver un compte le déconnecte et l'empêche de se reconnecter", async () => {
    const adminId = await createFirstAdmin({ name: "Admin", email: "admin@exemple.test", password: PASSWORD });
    const { userId, token } = await createInvitedUser({ name: "Membre", email: "membre@exemple.test", role: "reader" });
    await acceptInvitation(token, PASSWORD);
    const session = await createSession(userId);

    await setUserActive(userId, false, adminId);
    expect(await findSession(session.token)).toBeNull();
    expect((await authenticate("membre@exemple.test", PASSWORD)).status).toBe("invalid");
  });
});
