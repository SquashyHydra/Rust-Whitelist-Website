import WebSocket, { type RawData } from "ws";

import { env, requireEnv } from "@/lib/env";

type WebRconResponse = {
  Identifier?: number;
  Message?: string;
  Name?: string;
  Type?: string;
  Stacktrace?: string;
};

export function buildWhitelistCommand(steamId64: string) {
  if (!/^\d{17}$/.test(steamId64)) {
    throw new Error("A valid SteamID64 is required before sending an RCON whitelist command.");
  }

  return env.rcon.whitelistCommandTemplate.replaceAll("{steamId}", steamId64);
}

function buildWebRconUrl(host: string, port: number, password: string) {
  return `ws://${host}:${port}/${encodeURIComponent(password)}`;
}

function decodeMessage(data: RawData) {
  if (typeof data === "string") {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data.toString("utf8");
  }

  if (Array.isArray(data)) {
    return Buffer.concat(data).toString("utf8");
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }

  return "";
}

function parseWebRconResponse(data: RawData) {
  const message = decodeMessage(data);

  try {
    return JSON.parse(message) as WebRconResponse;
  } catch {
    return {
      Message: message,
    } satisfies WebRconResponse;
  }
}

export async function sendWhitelistCommand(steamId64: string) {
  const host = requireEnv("RCON_HOST", env.rcon.host);
  const port = Number(requireEnv("RCON_PORT", env.rcon.port.toString()));
  const password = requireEnv("RCON_PASSWORD", env.rcon.password);
  const command = buildWhitelistCommand(steamId64);
  const timeoutMs = Number(requireEnv("RCON_TIMEOUT_MS", env.rcon.timeout.toString()));
  const socketUrl = buildWebRconUrl(host, port, password);

  return new Promise<{ command: string; response: string }>((resolve, reject) => {
    const connection = new WebSocket(socketUrl);
    let settled = false;

    const timeout = setTimeout(() => {
      fail(new Error(`WebRCON request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      connection.removeAllListeners();
    }

    function finish(result: { command: string; response: string }) {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      connection.close();
      resolve(result);
    }

    function fail(error: Error) {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();

      if (connection.readyState === WebSocket.OPEN || connection.readyState === WebSocket.CONNECTING) {
        connection.close();
      }

      reject(error);
    }

    connection.once("open", () => {
      connection.send(
        JSON.stringify({
          Identifier: 1,
          Message: command,
          Name: "WebRcon",
          Type: "command",
        }),
      );
    });

    connection.on("message", (data: RawData) => {
      const response = parseWebRconResponse(data);

      if (typeof response.Identifier === "number" && response.Identifier !== 1) {
        return;
      }

      finish({
        command,
        response: response.Message ?? JSON.stringify(response),
      });
    });

    connection.once("error", (error: Error) => {
      fail(error instanceof Error ? error : new Error("WebRCON connection failed."));
    });

    connection.once("close", (code: number) => {
      if (!settled) {
        fail(new Error(`WebRCON connection closed before a response was received (code ${code}).`));
      }
    });
  });
}
