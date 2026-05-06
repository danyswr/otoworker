export class Renderer {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  camera: { x: number; y: number; zoom: number };

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.camera = { x: 0, y: 0, zoom: 1 };
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  begin() {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    // Center the camera
    this.ctx.translate(this.width / 2, this.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }

  end() {
    this.ctx.restore();
  }

  drawRect(x: number, y: number, w: number, h: number, color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawOutline(x: number, y: number, w: number, h: number, color: string, lineWidth: number = 2) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(x, y, w, h);
  }

  drawImage(img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) {
    this.ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }

  drawFlippedImage(img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) {
    this.ctx.save();
    this.ctx.translate(dx + dw, dy);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
    this.ctx.restore();
  }

  drawText(text: string, x: number, y: number, color: string = "white", font: string = "12px sans-serif") {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, x, y);
  }
}
