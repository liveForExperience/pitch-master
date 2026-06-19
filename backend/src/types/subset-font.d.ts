declare module 'subset-font' {
  /**
   * Subset a font file to only the glyphs needed for the given text.
   * @see https://github.com/papandreou/subset-font
   */
  export default function subsetFont(
    source: Buffer | Uint8Array,
    text: string,
    options?: {
      targetFormat?: 'sfnt' | 'woff' | 'woff2' | 'truetype';
      preserveNameIds?: number[];
      variationAxes?: Record<string, number | { min?: number; max?: number; default?: number }>;
      noLayoutClosure?: boolean;
    },
  ): Promise<Buffer>;
}
