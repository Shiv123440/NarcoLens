// @vitest-environment node
import { describe, expect, it } from "vitest";
import { appendCustody, csvCell, filterRecords, matchCommand, recordsToCsv, sha256Hex, validateImage, verifyChain } from "./forensics";
import { seedRecords } from "./app-data";

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0];
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
const file = (bytes: number[], name = "a.jpg", type = "image/jpeg", pad = 0) => new File([new Uint8Array([...bytes, ...new Array(pad).fill(0)])], name, { type });
const ok = async () => ({ width: 1280, height: 960 });

describe("validateImage", () => {
  it("rejects empty", async () => expect((await validateImage(new File([], "a.jpg"), ok)).ok).toBe(false));
  it("rejects HEIC", async () => { const r = await validateImage(file(JPEG, "a.heic", "image/heic"), ok); expect(!r.ok && r.code).toBe("HEIC"); });
  it("rejects renamed txt", async () => { const r = await validateImage(new File(["hello world!"], "a.jpg", { type: "image/jpeg" }), ok); expect(!r.ok && r.code).toBe("TYPE"); });
  it("rejects >10MB", async () => { const r = await validateImage(file(JPEG, "a.jpg", "image/jpeg", 11 * 1024 * 1024), ok); expect(!r.ok && r.code).toBe("SIZE"); });
  it("rejects small", async () => { const r = await validateImage(file(JPEG), async () => ({ width: 320, height: 240 })); expect(!r.ok && r.code).toBe("DIMENSIONS"); });
  it("rejects corrupt", async () => { const r = await validateImage(file(JPEG), async () => { throw new Error("x"); }); expect(!r.ok && r.code).toBe("DECODE"); });
  it.each([[JPEG], [PNG], [WEBP]])("accepts valid images", async (b) => expect((await validateImage(file(b), ok)).ok).toBe(true));
});

describe("custody chain", () => {
  it("verifies and detects tampering", async () => {
    let chain = await appendCustody([], "R1", "CREATED", "officer");
    chain = await appendCustody(chain, "R1", "SEALED", "officer");
    expect(await verifyChain(chain)).toEqual([true, true]);
    const tampered = chain.map((e, i) => (i === 0 ? { ...e, actor: "intruder" } : e));
    expect((await verifyChain(tampered))[0]).toBe(false);
    const broken = [chain[0]!, { ...chain[1]!, prevHash: "x" }];
    expect((await verifyChain(broken))[1]).toBe(false);
  });
  it("hashes deterministically", async () => {
    expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("audit helpers", () => {
  it("filters by verdict and query", () => {
    expect(filterRecords(seedRecords, { verdict: "POSITIVE" })).toHaveLength(1);
    expect(filterRecords(seedRecords, { q: "mumbai" })[0]?.id).toBe("NCR-2026-0912");
  });
  it("guards CSV formula injection", () => {
    expect(csvCell("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvCell('say "hi"')).toBe(`"say ""hi"""`);
    expect(recordsToCsv(seedRecords).split("\r\n")).toHaveLength(4);
  });
});

describe("matchCommand", () => {
  it("routes multilingual commands", () => {
    expect(matchCommand("capture now")?.type).toBe("CAPTURE");
    expect(matchCommand("फोटो लो")?.type).toBe("CAPTURE");
    expect(matchCommand("go to audit")).toEqual({ type: "NAVIGATE", to: "audit" });
    expect(matchCommand("start a new test")).toEqual({ type: "NAVIGATE", to: "scan" });
    expect(matchCommand("how are you")).toBeNull();
  });
});
