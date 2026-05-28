import assert from "node:assert/strict";
import test from "node:test";

import { extractPhoneFromWhatsAppId, toWahaChatId } from "@/lib/whatsapp/utils";

test("toWahaChatId normalizes Indonesian private phone numbers", () => {
  assert.equal(toWahaChatId("0812 345-678"), "62812345678@c.us");
  assert.equal(toWahaChatId("+62 (812) 345 678"), "62812345678@c.us");
  assert.equal(toWahaChatId("812345678"), "62812345678@c.us");
});

test("toWahaChatId keeps group chat id", () => {
  assert.equal(toWahaChatId("120363012345678901@g.us"), "120363012345678901@g.us");
});

test("toWahaChatId converts s.whatsapp.net to c.us", () => {
  assert.equal(toWahaChatId("62812345678@s.whatsapp.net"), "62812345678@c.us");
});

test("extractPhoneFromWhatsAppId reads private ids only", () => {
  assert.equal(extractPhoneFromWhatsAppId("62812345678@c.us"), "62812345678");
  assert.equal(extractPhoneFromWhatsAppId("0812345678"), "62812345678");
  assert.equal(extractPhoneFromWhatsAppId("120363012345678901@g.us"), null);
});
