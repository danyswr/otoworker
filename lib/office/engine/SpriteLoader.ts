export class SpriteLoader {
  static officeImage: HTMLImageElement | null = null;
  static wallImage: HTMLImageElement | null = null;
  static deskImage: HTMLImageElement | null = null;
  static meetingTableImage: HTMLImageElement | null = null;
  static characters: (HTMLImageElement | null)[] = Array(6).fill(null);

  static async loadSheets(): Promise<void> {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${src}`));
        img.src = src;
      });
    };

    try {
      this.officeImage = await loadImage('/Office.png');
    } catch {
      console.warn("Could not load /Office.png");
    }

    try {
      this.wallImage = await loadImage('/walls.png');
    } catch {
      console.warn("Could not load /walls.png");
    }

    try {
      this.deskImage = await loadImage('/desk.png');
    } catch {
      console.warn("Could not load /desk.png");
    }

    try {
      this.meetingTableImage = await loadImage('/meeting_table.png');
    } catch {
      console.warn("Could not load /meeting_table.png");
    }

    for (let i = 0; i < 6; i++) {
      try {
        this.characters[i] = await loadImage(`/char_${i}.png`);
      } catch {
        console.warn(`Could not load /char_${i}.png`);
      }
    }
  }
}

