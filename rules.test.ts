/// <reference types="vitest/globals" />
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

const RULES = readFileSync("firestore.rules", "utf8");

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "bingo-card-test",
    firestore: { rules: RULES, host: "127.0.0.1", port: 8080 },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const alice = () => testEnv.authenticatedContext("alice");
const bob   = () => testEnv.authenticatedContext("bob");
const anon  = () => testEnv.unauthenticatedContext();

// ── User profile ─────────────────────────────────────────────────────────────

describe("users/{uid}", () => {
  test("owner can write their own profile", async () => {
    await assertSucceeds(
      setDoc(doc(alice().firestore(), "users", "alice"), { displayName: "Alice" })
    );
  });

  test("owner can read their own profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice"), { displayName: "Alice" });
    });
    await assertSucceeds(getDoc(doc(alice().firestore(), "users", "alice")));
  });

  test("other user cannot read someone else's profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice"), { displayName: "Alice" });
    });
    await assertFails(getDoc(doc(bob().firestore(), "users", "alice")));
  });

  test("unauthenticated cannot read any profile", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice"), { displayName: "Alice" });
    });
    await assertFails(getDoc(doc(anon().firestore(), "users", "alice")));
  });
});

// ── Cards ─────────────────────────────────────────────────────────────────────

describe("users/{uid}/cards/{cardId}", () => {
  test("owner can create a card", async () => {
    await assertSucceeds(
      setDoc(doc(alice().firestore(), "users", "alice", "cards", "card1"), {
        name: "My Card",
        goals: [],
      })
    );
  });

  test("owner can read their own card", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice", "cards", "card1"), { name: "My Card" });
    });
    await assertSucceeds(
      getDoc(doc(alice().firestore(), "users", "alice", "cards", "card1"))
    );
  });

  test("owner can update their own card", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice", "cards", "card1"), { name: "Old" });
    });
    await assertSucceeds(
      updateDoc(doc(alice().firestore(), "users", "alice", "cards", "card1"), { name: "New" })
    );
  });

  test("owner can delete their own card", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice", "cards", "card1"), { name: "My Card" });
    });
    await assertSucceeds(
      deleteDoc(doc(alice().firestore(), "users", "alice", "cards", "card1"))
    );
  });

  test("other user cannot read an unshared card", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice", "cards", "card1"), { name: "My Card", shareId: null });
    });
    await assertFails(
      getDoc(doc(bob().firestore(), "users", "alice", "cards", "card1"))
    );
  });

  test("other user can read a shared card (shareId set)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice", "cards", "card1"), { name: "My Card", shareId: "share1" });
    });
    await assertSucceeds(
      getDoc(doc(bob().firestore(), "users", "alice", "cards", "card1"))
    );
  });

  test("unauthenticated user can read a shared card (shareId set)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice", "cards", "card1"), { name: "My Card", shareId: "share1" });
    });
    await assertSucceeds(
      getDoc(doc(anon().firestore(), "users", "alice", "cards", "card1"))
    );
  });

  test("other user cannot write to someone else's card", async () => {
    await assertFails(
      setDoc(doc(bob().firestore(), "users", "alice", "cards", "card1"), { name: "Hacked" })
    );
  });

  test("unauthenticated cannot read any card", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users", "alice", "cards", "card1"), { name: "My Card" });
    });
    await assertFails(
      getDoc(doc(anon().firestore(), "users", "alice", "cards", "card1"))
    );
  });
});

// ── Shares ────────────────────────────────────────────────────────────────────

describe("shares/{shareId}", () => {
  const validShare = {
    userId: "alice",
    cardId: "card1",
    createdAt: new Date(),
  };

  test("anyone (unauthenticated) can read a share", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "shares", "share1"), validShare);
    });
    await assertSucceeds(getDoc(doc(anon().firestore(), "shares", "share1")));
  });

  test("authenticated user can read a share", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "shares", "share1"), validShare);
    });
    await assertSucceeds(getDoc(doc(alice().firestore(), "shares", "share1")));
  });

  test("owner can create a share with their own userId", async () => {
    await assertSucceeds(
      setDoc(doc(alice().firestore(), "shares", "share1"), validShare)
    );
  });

  test("user cannot create a share impersonating another user", async () => {
    await assertFails(
      setDoc(doc(bob().firestore(), "shares", "share1"), {
        userId: "alice",   // bob claiming to be alice
        cardId: "card1",
        createdAt: new Date(),
      })
    );
  });

  test("unauthenticated cannot create a share", async () => {
    await assertFails(
      setDoc(doc(anon().firestore(), "shares", "share1"), {
        userId: "alice",
        cardId: "card1",
        createdAt: new Date(),
      })
    );
  });

  test("owner can delete their own share", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "shares", "share1"), validShare);
    });
    await assertSucceeds(deleteDoc(doc(alice().firestore(), "shares", "share1")));
  });

  test("other user cannot delete someone else's share", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "shares", "share1"), validShare);
    });
    await assertFails(deleteDoc(doc(bob().firestore(), "shares", "share1")));
  });

  test("unauthenticated cannot delete a share", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "shares", "share1"), validShare);
    });
    await assertFails(deleteDoc(doc(anon().firestore(), "shares", "share1")));
  });

  test("no one can update a share (immutable)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "shares", "share1"), validShare);
    });
    await assertFails(
      updateDoc(doc(alice().firestore(), "shares", "share1"), { cardId: "card2" })
    );
  });
});
