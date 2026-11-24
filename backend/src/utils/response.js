"use strict";

function ok(res, data, meta) {
  return res.status(200).json({
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

function created(res, data) {
  return res.status(201).json({ ok: true, data });
}

function noContent(res) {
  return res.status(204).send();
}

module.exports = { ok, created, noContent };
