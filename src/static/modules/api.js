// Copyright (c) 2024 iiPython

async function musicbrainz_request(endpoint, payload) {
    return await (await fetch(
        `https://musicbrainz.org/ws/2/${endpoint}?` + new URLSearchParams({ ...payload, ...{ fmt: "json" } }),
        {
            headers: {
                "User-Agent": "cdbar/0.5.2 ( ben@iipython.dev )"
            }
        }
    )).json();
}

export const lookup_barcode = async (barcode) => {
    const search = await musicbrainz_request("release", { query: `barcode:${barcode}`, limit: 1 });
    if (!search.count) return null;

    // Fetch release info as well
    const result = search.releases[0];
    const release = await musicbrainz_request(`release/${result.id}`, { inc: "recordings" });

    // Fetch cover art from LastFM
    const lastfm = await (await fetch("https://ws.audioscrobbler.com/2.0/?" + new URLSearchParams({
        method: "album.getinfo",
        api_key: "974a5ebc077564f72bd639d122479d4b",  // Yes, this is a public api key
        artist: result["artist-credit"][0].name,
        album: result.title,
        format: "json"
    }))).json();

    return {
        result,
        media: release.media,
        image: lastfm.error ? null : lastfm.album.image[lastfm.album.image.length - 1]["#text"]
    };
}
