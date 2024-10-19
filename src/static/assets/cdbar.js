// Copyright (c) 2024 iiPython

import { lookup_barcode } from "/modules/api.js";

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
    const data = await lookup_barcode(barcode);
    setTimeout(async () => {
        if (!data) return lookup_error("No matches found. :(");

        // Handle track information
        const tracks = [];
        for (const medium of data.media) {
            for (const track of medium.tracks) {
                const length = track.length / 1000;
                tracks.push(`
                    <tr>
                        <th>${track.number}</th>
                        <th>${track.title}</th>
                        <th>${!track.length ? "???" : `${Math.floor(length / 60)}:${length % 60 < 10 ? '0' : ''}${Math.round(length % 60)}`}</th>
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
            if (track_pages.length > 1) document.getElementById("page").innerText = `${page + 1} / ${track_pages.length}`;
        }

        // Update UI
        document.querySelector(`main[data-section = "result"]`).innerHTML = `
            <div class = "header">
                <img src = "${data.image}">
                <div>
                    <h1>${data.result.title.length > 16 ? data.result.title.slice(0, 16) + "..." : data.result.title}</h1>
                    <div class = "bottom">
                        <span>by ${data.result['artist-credit'][0].name}</span>
                        <span>${data.result.date}</span>
                    </div>
                </div>
            </div>
            <hr>
            <table></table>
            ${
                track_pages.length > 1
                ? `
                    <div class = "paginator">
                        <a id = "page-back" href = "#" disabled>←</a>
                        <span id = "page">1 / ${track_pages.length}</span>
                        <a id = "page-next" href = "#"${track_pages.length === 1 ? ' disabled' : ''}>→</a>
                    </div>
                `
                : ""
            }
            <hr>
            <div class = "links">
                <a href = "https://musicbrainz.org/release/${data.result.id}">MusicBrainz</a>
                ·
                <a href = "https://last.fm/music/${data.result['artist-credit'][0].name}/${data.result.title}">Last.fm</a>
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
});

// Load scanner script (only if we have a camera)
(async () => {
    if (!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)) return;
    if (!((await navigator.mediaDevices.enumerateDevices()).some(d => d.kind === "videoinput"))) return;

    const { MobileBarcodeReader } = await import("/modules/scanner.js");

    // Setup button
    const scan_link = document.createElement("a");
    scan_link.classList.add("scan-btn");
    scan_link.innerText = "Scan from camera instead.";
    document.querySelector(`main[data-section = "input"]`).appendChild(scan_link);
    
    // Handle clicking
    scan_link.addEventListener("click", () => {
        show_section("scan");
    
        // Handle scanning
        const reader = new MobileBarcodeReader();
        reader.begin_scanning();
    
        // Send to the lookup
        reader.on_barcode = (barcode) => {
            document.getElementById("barcode").value = barcode;
            perform_lookup();
        };
    });
})();
