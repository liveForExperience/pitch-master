declare module '@shuding/opentype.js' {
  export type Glyph = {
    unicode?: number;
  };

  export type Font = {
    charToGlyph(char: string): Glyph;
  };

  export function parse(buffer: ArrayBuffer): Font;
}
