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

document.getElementById("lookup").addEventListener("click", async () => {    
    const barcode = document.getElementById("barcode").value;
    if (!barcode.trim()) return lookup_error("No barcode... >:(");
    
    // Clean out any errors
    show_section("loading");
    document.getElementById("lookup-error").innerText = "";
    document.getElementById("barcode").style.borderColor = "white";
    
    // Perform actual barcode lookup
    const result = await fetch(`/api/barcode/${barcode}`);
    setTimeout(async () => {
        if (result.status === 404) return lookup_error("No matches found. :(");

        // Update information
        const json = await result.json();
        document.querySelector(`main[data-section = "result"]`).innerHTML = `
            <div class = "header">
                <img src = "${json.image}">
                <div>
                    <div class = "top">
                        <h1>${json.title}</h1>
                        <span>${json.date}</span>
                    </div>
                    <span>by ${json['artist-credit'][0].name}</span>
                </div>
            </div>
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
    }, 500);
});
