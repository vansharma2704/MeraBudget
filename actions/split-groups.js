"use server";

import { db } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";
import { revalidatePath } from "next/cache";
import { computeBalances, simplifyDebts } from "@/lib/split-math";

const MODES = ["equal", "amount", "percent", "shares"];
const round2 = (n) => Math.round(Number(n) * 100) / 100;

const fail = (error) => {
  if (error.message?.includes("Dynamic server usage")) throw error;
  console.error("Split groups error:", error.message);
  return { success: false, error: error.message };
};

async function requireUser() {
  const user = await getDbUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

// Load a group only if it belongs to the signed-in user
async function ownedGroup(groupId, user, include) {
  const group = await db.splitGroup.findFirst({ where: { id: groupId, userId: user.id }, include });
  if (!group) throw new Error("Group not found");
  return group;
}

const FULL = {
  members: { orderBy: [{ isSelf: "desc" }, { createdAt: "asc" }] },
  expenses: { orderBy: { date: "desc" } },
  settlements: { orderBy: { date: "desc" } },
};

const plainExpense = (e) => ({
  id: e.id,
  description: e.description,
  amount: Number(e.amount),
  splitMode: e.splitMode,
  shares: Array.isArray(e.shares) ? e.shares.map((s) => ({ memberId: s.memberId, amount: Number(s.amount) })) : [],
  paidById: e.paidById,
  date: e.date.toISOString(),
});

const plainSettlement = (s) => ({
  id: s.id,
  amount: Number(s.amount),
  fromId: s.fromId,
  toId: s.toId,
  date: s.date.toISOString(),
});

// Group with computed balances and the fewest payments needed to settle up
function summarize(group) {
  const members = group.members.map((m) => ({ id: m.id, name: m.name, isSelf: m.isSelf }));
  const expenses = group.expenses.map(plainExpense);
  const settlements = group.settlements.map(plainSettlement);
  const balances = computeBalances(members, expenses, settlements);
  const self = members.find((m) => m.isSelf);
  return {
    id: group.id,
    name: group.name,
    createdAt: group.createdAt.toISOString(),
    members,
    expenses,
    settlements,
    balances,
    transfers: simplifyDebts(balances),
    yourBalance: self ? balances[self.id] : 0,
    totalSpent: round2(expenses.reduce((a, e) => a + e.amount, 0)),
  };
}

export async function getGroups() {
  try {
    const user = await requireUser();
    const groups = await db.splitGroup.findMany({
      where: { userId: user.id },
      include: FULL,
      orderBy: { updatedAt: "desc" },
    });
    return { success: true, data: groups.map(summarize) };
  } catch (error) {
    return fail(error);
  }
}

export async function getGroup(groupId) {
  try {
    const user = await requireUser();
    return { success: true, data: summarize(await ownedGroup(groupId, user, FULL)) };
  } catch (error) {
    return fail(error);
  }
}

export async function createGroup({ name, members = [] }) {
  try {
    const user = await requireUser();
    const groupName = String(name || "").trim();
    const others = [...new Set(members.map((m) => String(m || "").trim()).filter(Boolean))];
    if (!groupName) throw new Error("Give the group a name");
    if (others.length === 0) throw new Error("Add at least one other person");

    const group = await db.splitGroup.create({
      data: {
        name: groupName,
        userId: user.id,
        members: { create: [{ name: "You", isSelf: true }, ...others.map((n) => ({ name: n }))] },
      },
    });
    revalidatePath("/split");
    return { success: true, data: { id: group.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteGroup(groupId) {
  try {
    const user = await requireUser();
    await ownedGroup(groupId, user);
    await db.splitGroup.delete({ where: { id: groupId } });
    revalidatePath("/split");
    return { success: true };
  } catch (error) {
    return fail(error);
  }
}

export async function addMember(groupId, name) {
  try {
    const user = await requireUser();
    const group = await ownedGroup(groupId, user, { members: true });
    const memberName = String(name || "").trim();
    if (!memberName) throw new Error("Enter a name");
    if (group.members.some((m) => m.name.toLowerCase() === memberName.toLowerCase())) {
      throw new Error(`${memberName} is already in this group`);
    }
    await db.groupMember.create({ data: { name: memberName, groupId } });
    await db.splitGroup.update({ where: { id: groupId }, data: { updatedAt: new Date() } });
    return getGroup(groupId);
  } catch (error) {
    return fail(error);
  }
}

export async function removeMember(groupId, memberId) {
  try {
    const user = await requireUser();
    const group = await ownedGroup(groupId, user, FULL);
    const member = group.members.find((m) => m.id === memberId);
    if (!member) throw new Error("Person not found");
    if (member.isSelf) throw new Error("You can't remove yourself");
    const involved =
      group.expenses.some((e) => e.paidById === memberId || (e.shares || []).some((s) => s.memberId === memberId)) ||
      group.settlements.some((s) => s.fromId === memberId || s.toId === memberId);
    if (involved) throw new Error(`${member.name} is part of expenses — delete those first`);
    await db.groupMember.delete({ where: { id: memberId } });
    return getGroup(groupId);
  } catch (error) {
    return fail(error);
  }
}

export async function addExpense(groupId, data) {
  try {
    const user = await requireUser();
    const group = await ownedGroup(groupId, user, { members: true });
    const memberIds = new Set(group.members.map((m) => m.id));

    const description = String(data?.description || "").trim();
    const amount = round2(data?.amount);
    const splitMode = MODES.includes(data?.splitMode) ? data.splitMode : "equal";
    const shares = (Array.isArray(data?.shares) ? data.shares : [])
      .map((s) => ({ memberId: s.memberId, amount: round2(s.amount) }))
      .filter((s) => s.amount > 0);

    if (!description) throw new Error("Add a description");
    if (!(amount > 0)) throw new Error("Amount must be more than 0");
    if (!memberIds.has(data?.paidById)) throw new Error("Choose who paid");
    if (shares.length === 0) throw new Error("Split it between at least one person");
    if (shares.some((s) => !memberIds.has(s.memberId))) throw new Error("Unknown person in split");
    if (new Set(shares.map((s) => s.memberId)).size !== shares.length) throw new Error("Someone is listed twice");
    const sum = round2(shares.reduce((a, s) => a + s.amount, 0));
    if (Math.abs(sum - amount) > 0.01) throw new Error("Shares must add up to the amount");

    await db.groupExpense.create({
      data: {
        description,
        amount,
        splitMode,
        shares,
        paidById: data.paidById,
        groupId,
        date: data?.date ? new Date(data.date) : new Date(),
      },
    });
    await db.splitGroup.update({ where: { id: groupId }, data: { updatedAt: new Date() } });
    revalidatePath("/split");
    return getGroup(groupId);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteExpense(groupId, expenseId) {
  try {
    const user = await requireUser();
    await ownedGroup(groupId, user);
    const { count } = await db.groupExpense.deleteMany({ where: { id: expenseId, groupId } });
    if (!count) throw new Error("Expense not found");
    revalidatePath("/split");
    return getGroup(groupId);
  } catch (error) {
    return fail(error);
  }
}

// Record that `fromId` paid `toId` back
export async function recordSettlement(groupId, { fromId, toId, amount }) {
  try {
    const user = await requireUser();
    const group = await ownedGroup(groupId, user, { members: true });
    const ids = new Set(group.members.map((m) => m.id));
    const value = round2(amount);
    if (!ids.has(fromId) || !ids.has(toId) || fromId === toId) throw new Error("Choose two different people");
    if (!(value > 0)) throw new Error("Amount must be more than 0");

    await db.groupSettlement.create({ data: { fromId, toId, amount: value, groupId } });
    await db.splitGroup.update({ where: { id: groupId }, data: { updatedAt: new Date() } });
    revalidatePath("/split");
    return getGroup(groupId);
  } catch (error) {
    return fail(error);
  }
}

export async function deleteSettlement(groupId, settlementId) {
  try {
    const user = await requireUser();
    await ownedGroup(groupId, user);
    const { count } = await db.groupSettlement.deleteMany({ where: { id: settlementId, groupId } });
    if (!count) throw new Error("Payment not found");
    revalidatePath("/split");
    return getGroup(groupId);
  } catch (error) {
    return fail(error);
  }
}
