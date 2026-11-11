// Ma'lumotlar ombori. Ishlab chiqarishda — MongoDB Atlas (MONGODB_URI).
// Lokal sinov uchun MEMORY_STORE=1 bo'lsa — xotirada (faqat dev-server).
import crypto from "node:crypto";
import { env } from "./security.js";

let storePromise = globalThis.__iqStore;

export function getStore() {
  if (!storePromise) storePromise = globalThis.__iqStore = env("MONGODB_URI") ? mongoStore() : env("MEMORY_STORE") === "1" ? Promise.resolve(memoryStore()) : Promise.reject(Object.assign(new Error("Ma'lumotlar bazasi sozlanmagan"), { code: 503 }));
  return storePromise.catch((e) => { storePromise = globalThis.__iqStore = null; throw e; });
}

/* ======================= MongoDB ======================= */
async function mongoStore() {
  const { MongoClient, ObjectId } = await import("mongodb");
  const client = new MongoClient(env("MONGODB_URI"), { maxPoolSize: 5, serverSelectionTimeoutMS: 8000, retryWrites: true });
  await client.connect();
  const db = client.db(env("MONGODB_DB", "companyiq"));
  const users = db.collection("users"), ratings = db.collection("ratings"), rate = db.collection("rate_limits"),
    jtis = db.collection("used_tokens"), audit = db.collection("audit"), backups = db.collection("backups");
  await Promise.all([
    users.createIndex({ login: 1 }, { unique: true }),
    ratings.createIndex({ iq: -1, created_at: 1 }),
    rate.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
    jtis.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
    audit.createIndex({ at: -1 }),
    backups.createIndex({ at: -1 }),
  ]);
  const oid = (id) => { try { return new ObjectId(String(id)); } catch { return null; } };
  const pub = (d) => d && ({ ...d, id: String(d._id), _id: undefined });
  return {
    kind: "mongo",
    findUser: (login) => users.findOne({ login: String(login).toLowerCase() }),
    createUser: (doc) => users.insertOne({ ...doc, login: doc.login.toLowerCase() }),
    updateUser: (login, patch) => users.updateOne({ login: String(login).toLowerCase() }, { $set: patch }),
    deleteUser: (login) => users.deleteOne({ login: String(login).toLowerCase() }),
    listUsers: async () => (await users.find({}, { projection: { pass: 0 } }).sort({ created_at: -1 }).limit(1000).toArray()).map(pub),
    insertRating: (doc) => ratings.insertOne(doc),
    topRatings: async (limit) => (await ratings.find({ hidden: { $ne: true } }, { projection: { name: 1, age: 1, iq: 1, percentile: 1, vip: 1, created_at: 1 } }).sort({ iq: -1, created_at: 1 }).limit(limit).toArray()).map(pub),
    listRatings: async (limit, skip) => (await ratings.find({}, { projection: { details: 0, ip: 0 } }).sort({ created_at: -1 }).skip(skip).limit(limit).toArray()).map(pub),
    deleteRating: (id) => ratings.deleteOne({ _id: oid(id) }),
    count: async () => ({ users: await users.countDocuments(), ratings: await ratings.countDocuments(), backups: await backups.countDocuments() }),
    useJti: async (jti, exp) => { try { await jtis.insertOne({ _id: jti, expireAt: new Date(exp * 1000) }); return true; } catch { return false; } },
    hit: async (key, windowSec, max) => {
      const r = await rate.findOneAndUpdate({ _id: key }, { $inc: { n: 1 }, $setOnInsert: { expireAt: new Date(Date.now() + windowSec * 1000) } }, { upsert: true, returnDocument: "after" });
      const doc = r?.value ?? r; return { ok: (doc?.n ?? 1) <= max, n: doc?.n ?? 1 };
    },
    resetHits: (key) => rate.deleteOne({ _id: key }),
    log: (e) => audit.insertOne({ ...e, at: new Date() }),
    listAudit: async (limit) => (await audit.find({}).sort({ at: -1 }).limit(limit).toArray()).map(pub),
    dumpAll: async () => ({ users: await users.find({}).toArray(), ratings: await ratings.find({}).toArray(), audit: await audit.find({}).sort({ at: -1 }).limit(5000).toArray() }),
    saveBackup: (doc) => backups.insertOne({ ...doc, at: new Date() }),
    listBackups: async () => (await backups.find({}, { projection: { box: 0 } }).sort({ at: -1 }).limit(50).toArray()).map(pub),
    getBackup: async (id) => pub(await backups.findOne({ _id: oid(id) })),
    pruneBackups: async (keep) => { const old = await backups.find({}, { projection: { _id: 1 } }).sort({ at: -1 }).skip(keep).toArray(); if (old.length) await backups.deleteMany({ _id: { $in: old.map((o) => o._id) } }); },
    restore: async (data) => {
      // faqat foydalanuvchi va reytinglar tiklanadi; mavjud yozuvlar ustidan yozilmaydi
      let u = 0, r = 0;
      const withId = (d) => { const { _id, ...rest } = d; const o = oid(_id); return o ? { ...rest, _id: o } : rest; };
      for (const d of data.users || []) { try { await users.insertOne({ ...withId(d), created_at: new Date(d.created_at || Date.now()) }); u++; } catch {} }
      for (const d of data.ratings || []) { try { await ratings.insertOne({ ...withId(d), created_at: new Date(d.created_at || Date.now()) }); r++; } catch {} }
      return { users: u, ratings: r };
    },
  };
}

/* ======================= Xotira (faqat lokal sinov) ======================= */
function memoryStore() {
  const S = { users: [], ratings: [], rate: new Map(), jti: new Set(), audit: [], backups: [] };
  const id = () => crypto.randomBytes(12).toString("hex");
  const pub = (d) => d && ({ ...d, id: d._id, _id: undefined });
  return {
    kind: "memory",
    findUser: async (login) => S.users.find((u) => u.login === String(login).toLowerCase()) || null,
    createUser: async (doc) => { if (S.users.some((u) => u.login === doc.login.toLowerCase())) throw Object.assign(new Error("dup"), { code: 11000 }); S.users.push({ ...doc, _id: id(), login: doc.login.toLowerCase() }); },
    updateUser: async (login, patch) => { const u = S.users.find((x) => x.login === String(login).toLowerCase()); if (u) Object.assign(u, patch); return { matchedCount: u ? 1 : 0 }; },
    deleteUser: async (login) => { const n = S.users.length; S.users = S.users.filter((u) => u.login !== String(login).toLowerCase()); return { deletedCount: n - S.users.length }; },
    listUsers: async () => S.users.map(({ pass, ...u }) => pub(u)),
    insertRating: async (doc) => { S.ratings.push({ ...doc, _id: id() }); },
    topRatings: async (limit) => S.ratings.filter((r) => !r.hidden).sort((a, b) => b.iq - a.iq || a.created_at - b.created_at).slice(0, limit).map(({ name, age, iq, percentile, vip, created_at, _id }) => pub({ name, age, iq, percentile, vip, created_at, _id })),
    listRatings: async (limit, skip) => [...S.ratings].reverse().slice(skip, skip + limit).map(({ details, ip, ...r }) => pub(r)),
    deleteRating: async (rid) => { const n = S.ratings.length; S.ratings = S.ratings.filter((r) => r._id !== rid); return { deletedCount: n - S.ratings.length }; },
    count: async () => ({ users: S.users.length, ratings: S.ratings.length, backups: S.backups.length }),
    useJti: async (j) => (S.jti.has(j) ? false : (S.jti.add(j), true)),
    hit: async (key, windowSec, max) => { const now = Date.now(); let e = S.rate.get(key); if (!e || e.exp < now) e = { n: 0, exp: now + windowSec * 1000 }; e.n++; S.rate.set(key, e); return { ok: e.n <= max, n: e.n }; },
    resetHits: async (key) => S.rate.delete(key),
    log: async (e) => S.audit.unshift({ ...e, _id: id(), at: new Date() }),
    listAudit: async (limit) => S.audit.slice(0, limit).map(pub),
    dumpAll: async () => ({ users: S.users, ratings: S.ratings, audit: S.audit }),
    saveBackup: async (doc) => S.backups.unshift({ ...doc, _id: id(), at: new Date() }),
    listBackups: async () => S.backups.map(({ box, ...b }) => pub(b)),
    getBackup: async (bid) => pub(S.backups.find((b) => b._id === bid)),
    pruneBackups: async (keep) => { S.backups = S.backups.slice(0, keep); },
    restore: async (data) => { let u = 0, r = 0; for (const d of data.users || []) if (!S.users.some((x) => x.login === d.login)) { S.users.push(d); u++; } for (const d of data.ratings || []) if (!S.ratings.some((x) => x._id === d._id)) { S.ratings.push(d); r++; } return { users: u, ratings: r }; },
  };
}
