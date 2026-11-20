declare module 'imagetracerjs';
declare module 'opentype.js' {
  export class Path {
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
    curveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
    close(): void;
  }
  export class Glyph {
    constructor(o: { name: string; unicode: number; advanceWidth: number; path: Path });
  }
  export class Font {
    constructor(o: {
      familyName: string; styleName: string; unitsPerEm: number;
      ascender: number; descender: number; glyphs: Glyph[];
    });
    tables: any;
    toArrayBuffer(): ArrayBuffer;
  }
  const _default: { Path: typeof Path; Glyph: typeof Glyph; Font: typeof Font };
  export default _default;
}
