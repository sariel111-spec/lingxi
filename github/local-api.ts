type LocalEntry = {
  id?: number;
  kind: string;
  title: string;
  content: string;
  extra: Record<string, string | string[]>;
  createdAt?: string;
  updatedAt?: string;
};

type LocalFile = {
  id?: number;
  name: string;
  type: string;
  size: number;
  note: string;
  createdAt: string;
  url: string;
};

const DB_NAME = "yizhen-qinghuan-local";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("entries")) database.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
      if (!database.objectStoreNames.contains("files")) database.createObjectStore("files", { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeRequest<T>(storeName: "entries" | "files", mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  return await new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = action(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

const all = <T,>(store: "entries" | "files") => storeRequest<T[]>(store, "readonly", objectStore => objectStore.getAll());
const get = <T,>(store: "entries" | "files", id: number) => storeRequest<T | undefined>(store, "readonly", objectStore => objectStore.get(id));
const put = <T,>(store: "entries" | "files", value: T) => storeRequest<IDBValidKey>(store, "readwrite", objectStore => objectStore.put(value));
const add = <T,>(store: "entries" | "files", value: T) => storeRequest<IDBValidKey>(store, "readwrite", objectStore => objectStore.add(value));
const remove = (store: "entries" | "files", id: number) => storeRequest<undefined>(store, "readwrite", objectStore => objectStore.delete(id));

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function handleEntries(url: URL, init?: RequestInit) {
  const method = (init?.method || "GET").toUpperCase();
  if (method === "GET") {
    const entries = await all<LocalEntry>("entries");
    return json({ entries: entries.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) });
  }
  if (method === "DELETE") {
    const id = Number(url.searchParams.get("id"));
    if (!id) return json({ error: "缺少记录编号" }, 400);
    await remove("entries", id);
    return json({ ok: true });
  }
  const body = JSON.parse(String(init?.body || "{}")) as LocalEntry;
  if (!body.kind?.trim() || !body.title?.trim()) return json({ error: "分类与题目不能为空" }, 400);
  const now = new Date().toISOString();
  if (method === "PUT" && body.id) {
    const previous = await get<LocalEntry>("entries", body.id);
    if (!previous) return json({ error: "没有找到这则记录" }, 404);
    const entry = { ...previous, ...body, updatedAt: now };
    await put("entries", entry);
    return json({ entry });
  }
  const entry: LocalEntry = { kind: body.kind.trim(), title: body.title.trim(), content: body.content?.trim() || "", extra: body.extra || {}, createdAt: now, updatedAt: now };
  const id = Number(await add("entries", entry));
  return json({ entry: { ...entry, id } }, 201);
}

async function handleFiles(init?: RequestInit) {
  const method = (init?.method || "GET").toUpperCase();
  if (method === "GET") return json({ files: (await all<LocalFile>("files")).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  const form = init?.body as FormData;
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "请选择文件" }, 400);
  const record: LocalFile = { name: file.name, type: file.type, size: file.size, note: String(form.get("note") || ""), createdAt: new Date().toISOString(), url: await fileToDataUrl(file) };
  const id = Number(await add("files", record));
  return json({ file: { ...record, id } }, 201);
}

export function installLocalApi() {
  const networkFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(raw, window.location.href);
    if (!url.pathname.includes("/api/")) return networkFetch(input, init);
    try {
      if (url.pathname.endsWith("/api/entries")) return await handleEntries(url, init);
      if (url.pathname.endsWith("/api/files")) return await handleFiles(init);
      return json({ error: "本地接口不存在" }, 404);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "本地存储操作失败" }, 500);
    }
  };
}
