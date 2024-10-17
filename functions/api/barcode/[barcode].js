// Copyright (c) 2024 iiPython

async function api_request(endpoint, payload) {
    return await (await fetch(
        `https://musicbrainz.org/ws/2/${endpoint}?` + new URLSearchParams({ ...payload, ...{ fmt: "json" } }),
        {
            headers: {
                "User-Agent": "cdbar/0.1.0 ( ben@iipython.dev )"
            }
        }
    )).json();
}

export async function onRequestGet(context) {
    const result = await api_request(`release`, { query: `barcode:${context.params.barcode}`, limit: 1 });
    if (!result.count) return new Response(null, { status: 404 });
    const lastfm = await (await fetch("https://ws.audioscrobbler.com/2.0/?" + new URLSearchParams({
        method: "album.getinfo",
        api_key: "974a5ebc077564f72bd639d122479d4b",
        artist: result.releases[0]["artist-credit"][0].name,
        album: result.releases[0].title,
        format: "json"
    }))).json();
    result.releases[0].image = lastfm.error ? null : lastfm.album.image[lastfm.album.image.length - 1]["#text"];
    return new Response(JSON.stringify(result.releases[0]));
}
