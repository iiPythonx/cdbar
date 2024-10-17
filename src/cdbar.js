// Copyright (c) 2024 iiPython

function show_section(name) {
    for (const section of document.querySelectorAll("main")) {
        section.style.opacity = "0";
    };
    setTimeout(() => {
        for (const section of document.querySelectorAll("main")) {
            section.style.display = "none";
        }
        const section = document.querySelector(`main[data-section = "${name}"]`);
        section.classList.add("notransition");
        section.style.opacity = "0";
        section.style.display = "flex";
        section.classList.remove("notransition");
        setTimeout(() => { section.style.opacity = "1"; }, 100);
    }, 500);
}

function lookup_error(text) {
    document.getElementById("lookup-error").innerText = text;
    document.getElementById("barcode").style.borderColor = "#89043d";
    if (document.querySelector(`main[data-section = "input"]`).style.display === "none") show_section("input");
}

async function perform_lookup() {
    const barcode = document.getElementById("barcode").value;
    if (!barcode.trim()) return lookup_error("No barcode... >:(");
    
    // Clean out any errors
    show_section("loading");
    document.getElementById("lookup-error").innerText = "";
    document.getElementById("barcode").style.borderColor = "white";
    
    // Perform actual barcode lookup
    const result = await fetch(`https://cdbar.iipython.dev/api/barcode/${barcode}`);
    setTimeout(async () => {
        if (result.status === 404) return lookup_error("No matches found. :(");
        const json = await result.json();

        // Handle track information
        const tracks = [];
        for (const medium of json.media) {
            for (const track of medium.tracks) {
                const length = track.length / 1000;
                tracks.push(`
                    <tr>
                        <th>${track.number}</th>
                        <th>${track.title}</th>
                        <th>${Math.floor(length / 60)}:${length % 60 < 10 ? '0' : ''}${Math.round(length % 60)}</th>
                    </tr>
                `);
            }
        };
        const track_pages = []
        for (let i = 0; i < tracks.length; i += 10) track_pages.push(tracks.slice(i, i + 10));

        var current_page = 0;
        function display_page(page) {
            if (track_pages.length > 1) {
                while (track_pages[page].length < 10) track_pages[page].push("<tr><th>&nbsp;</th><th></th><th></th></tr>");
            }
            document.querySelector("table").innerHTML = `
                <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Length</th>
                </tr>
                ${track_pages[page].join("")}
            `;
            document.getElementById("page").innerText = `${page + 1} / ${track_pages.length}`;
        }

        // Update UI
        document.querySelector(`main[data-section = "result"]`).innerHTML = `
            <div class = "header">
                <img src = "${json.image}">
                <div>
                    <div class = "top">
                        <h1>${json.title.length > 15 ? json.title.slice(0, 15) + "..." : json.title}</h1>
                        <span>${json.date}</span>
                    </div>
                    <span>by ${json['artist-credit'][0].name}</span>
                </div>
            </div>
            <hr>
            <table></table>
            ${
                track_pages.length > 1
                ? `
                    <div class = "paginator">
                        <a id = "page-back" href = "#" disabled>←</a>
                        <span id = "page">1 / 2</span>
                        <a id = "page-next" href = "#"${track_pages.length === 1 ? ' disabled' : ''}>→</a>
                    </div>
                `
                : ""
            }
            <hr>
            <div class = "links">
                <a href = "https://musicbrainz.org/release/${json.id}">MusicBrainz</a>
                ·
                <a href = "https://last.fm/music/${json['artist-credit'][0].name}/${json.title}">Last.fm</a>
            </div>
            <a href = "#" id = "back">← Back to search</a>
        `;
        show_section("result");
    
        // Handle going back
        document.getElementById("back").addEventListener("click", () => {
            document.getElementById("barcode").value = "";
            show_section("input");
        });

        // Handle pagination
        display_page(0);
        if (track_pages.length > 1) {
            const back = document.getElementById("page-back"), next = document.getElementById("page-next");
            back.addEventListener("click", () => {
                if (back.hasAttribute("disabled")) return;
                current_page--;
                display_page(current_page);
                if (current_page === 0) back.setAttribute("disabled", "");
                next.removeAttribute("disabled");
            });
            next.addEventListener("click", () => {
                if (next.hasAttribute("disabled")) return;
                current_page++;
                display_page(current_page);
                back.removeAttribute("disabled");
                if (current_page === track_pages.length - 1) next.setAttribute("disabled", "");
            });
        }
    }, 500);

}

document.getElementById("lookup").addEventListener("click", perform_lookup);
document.getElementById("barcode").addEventListener("keyup", (e) => {
    if (e.key === "Enter") perform_lookup();
})
