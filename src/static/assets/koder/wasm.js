importScripts("/assets/koder/zbar.js");
importScripts("/assets/koder/browser.js");
(async () => {
    const koder = await new Koder().initialize({ wasmDirectory: "/assets/koder" });
    self.addEventListener("message", event => {
        if ("width" in event.data && "height" in event.data) {
            this.width = event.data.width;
            this.height = event.data.height;
        }
        const { data } = event.data;
        if (!data) return;
        const scanResult = koder.decode(data, this.width, this.height);
        if (scanResult) {
            postMessage({ data: scanResult });
        }
    });
})();