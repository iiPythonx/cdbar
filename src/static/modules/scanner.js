// Copyright (c) 2024 iiPython

export class MobileBarcodeReader {
    constructor() {
        this.canvas = document.querySelector("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.setup_worker();
    }
    async setup_worker() {
        this.worker = new Worker("/modules/koder/wasm.js");
        this.worker.onmessage = (ev) => this.kill_worker(ev.data.data);
        if (navigator.serviceWorker) await navigator.serviceWorker.register("/modules/koder/sw.js");
    }
    kill_worker(data) {
        this.worker.terminate();
        this.stop_video();
        this.on_barcode(data);
    }
    tick(time) {
        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            this.canvas.width = Math.min(320, this.video.videoWidth);
            this.canvas.height = Math.min(430, this.video.videoHeight);

            const sx = (this.canvas.width - 200) / 2;
            const sy = (this.canvas.height - 200) / 2;

            this.ctx.drawImage(this.video, 0, 0);
            this.ctx.fillStyle = "black";
            this.ctx.globalAlpha = 0.6;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.video, sx, sy, 200, 200, sx, sy, 200, 200);
            if (time - this.oldTime > 600) {
                this.oldTime = time;
                let imageData = this.ctx.getImageData(sx, sy, 200, 200);
                this.worker.postMessage({ data: imageData.data, width: imageData.width, height: imageData.height });
            }
        }
        requestAnimationFrame((t) => this.tick(t));
    }
    stop_video() {
        this.video.pause();
        this.video.srcObject.getVideoTracks().forEach(track => track.stop());
        this.video.srcObject = null;
    }
    async begin_scanning() {
        this.oldTime = 0;

        // Setup video stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: "environment" } });
        this.video = document.createElement("video");
        this.video.srcObject = stream;
        this.video.setAttribute("playsinline", "true");
        this.video.play();
        requestAnimationFrame((t) => this.tick(t));
    }
}
