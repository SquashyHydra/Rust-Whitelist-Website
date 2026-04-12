type SteamProfileResolution = {
  normalizedUrl: string;
  vanityName: string | null;
  steamId64: string | null;
  personaName: string | null;
  avatarUrl: string | null;
  resolutionState: "RESOLVED" | "UNRESOLVED" | "ERROR";
  resolutionError: string | null;
};

const steamProfileRegex = /^https:\/\/steamcommunity\.com\/(profiles\/(\d{17})|id\/([A-Za-z0-9_-]{2,64}))\/?$/i;
const invalidSteamProfileMessage =
  "This Steam profile could not be verified. Fake, incorrect, or non-existent Steam links are not accepted.";

function normalizeSteamProfileUrl(rawUrl: string) {
  const url = new URL(rawUrl.trim());
  url.protocol = "https:";
  url.hash = "";
  url.search = "";
  let pathname = url.pathname.replace(/\/+$/, "");

  if (!pathname) {
    pathname = "/";
  }

  url.pathname = pathname.toLowerCase().startsWith("/profiles/")
    ? `/profiles/${pathname.split("/").filter(Boolean)[1]}`
    : `/id/${pathname.split("/").filter(Boolean)[1]}`;

  return url.toString();
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 3600,
    },
  });

  if (!response.ok) {
    throw new Error(`Steam API request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function resolveVanityUrl(vanityName: string, apiKey: string) {
  const url = new URL("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("vanityurl", vanityName);

  const payload = await fetchJson<{
    response: {
      success: number;
      steamid?: string;
      message?: string;
    };
  }>(url.toString());

  if (payload.response.success !== 1 || !payload.response.steamid) {
    throw new Error(invalidSteamProfileMessage);
  }

  return payload.response.steamid;
}

async function fetchPlayerSummary(steamId64: string, apiKey: string) {
  const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamids", steamId64);

  const payload = await fetchJson<{
    response: {
      players: Array<{
        steamid: string;
        personaname?: string;
        avatarfull?: string;
      }>;
    };
  }>(url.toString());

  return payload.response.players[0] ?? null;
}

export async function resolveSteamProfile(
  steamProfileUrl: string,
  apiKey: string | undefined,
): Promise<SteamProfileResolution> {
  const normalizedUrl = normalizeSteamProfileUrl(steamProfileUrl);
  const match = normalizedUrl.match(steamProfileRegex);

  if (!match) {
    return {
      normalizedUrl,
      vanityName: null,
      steamId64: null,
      personaName: null,
      avatarUrl: null,
      resolutionState: "ERROR",
      resolutionError: "Use a Steam profile URL in the form /profiles/<steamId64> or /id/<vanityName>.",
    };
  }

  const steamId64FromUrl = match[2] ?? null;
  const vanityName = match[3] ?? null;

  try {
    if (!apiKey) {
      return {
        normalizedUrl,
        vanityName,
        steamId64: steamId64FromUrl,
        personaName: null,
        avatarUrl: null,
        resolutionState: "UNRESOLVED",
        resolutionError: "STEAM_API_KEY is required to verify Steam profile links.",
      };
    }

    let steamId64 = steamId64FromUrl;

    if (!steamId64 && vanityName) {
      steamId64 = await resolveVanityUrl(vanityName, apiKey);
    }

    if (!steamId64) {
      return {
        normalizedUrl,
        vanityName,
        steamId64: null,
        personaName: null,
        avatarUrl: null,
        resolutionState: "UNRESOLVED",
        resolutionError: "Steam ID could not be resolved.",
      };
    }

    const summary = await fetchPlayerSummary(steamId64, apiKey);

    if (!summary) {
      return {
        normalizedUrl,
        vanityName,
        steamId64: null,
        personaName: null,
        avatarUrl: null,
        resolutionState: "UNRESOLVED",
        resolutionError: invalidSteamProfileMessage,
      };
    }

    return {
      normalizedUrl,
      vanityName,
      steamId64,
      personaName: summary?.personaname ?? null,
      avatarUrl: summary?.avatarfull ?? null,
      resolutionState: "RESOLVED",
      resolutionError: null,
    };
  } catch (error) {
    return {
      normalizedUrl,
      vanityName,
      steamId64: null,
      personaName: null,
      avatarUrl: null,
      resolutionState: "ERROR",
      resolutionError:
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : invalidSteamProfileMessage,
    };
  }
}

export function toSteamCommunityProfileUrl(steamId64: string) {
  return `https://steamcommunity.com/profiles/${steamId64}`;
}
