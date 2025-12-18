/**
 * TypeScript declaration stub for the sea-core WASM module.
 * 
 * This stub provides type information during type checking without requiring
 * the actual WASM build artifacts. The real WASM files are generated at build
 * time and copied from the domainforge pkg directory.
 */
declare module '../../wasm/sea_core.js' {
  /**
   * Initialize the WASM module.
   * Must be called before using any other exports.
   */
  export default function init(): Promise<void>;

  /**
   * Parsed SEA DSL graph representation.
   * Provides access to entities, resources, flows, and other DSL constructs.
   */
  export class Graph {
    /**
     * Parse SEA DSL source code into a Graph.
     * @param source - The SEA DSL source text
     * @returns Parsed Graph instance
     * @throws Error if parsing fails
     */
    static parse(source: string): Graph;
    
    /**
     * Free the WASM memory associated with this Graph.
     * Call this when done with the Graph to prevent memory leaks.
     */
    free(): void;
  }

  /**
   * Format SEA DSL source code.
   * @param source - The SEA DSL source text
   * @param indentWidth - Number of spaces per indent level
   * @param useTabs - Whether to use tabs instead of spaces
   * @param alignArrows - Whether to align arrows in declarations
   * @param sortNodes - Whether to sort nodes alphabetically
   * @returns Formatted source text
   */
  export function formatSource(
    source: string,
    indentWidth: number,
    useTabs: boolean,
    alignArrows: boolean,
    sortNodes: boolean
  ): string;
}
