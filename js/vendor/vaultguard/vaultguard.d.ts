declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * wasm/vaultguard-core/assembly/index/fnv1a_hash
   * @param ptr `usize`
   * @param len `i32`
   * @returns `u32`
   */
  export function fnv1a_hash(ptr: number, len: number): number;
  /**
   * wasm/vaultguard-core/assembly/index/compute_dom_integrity
   * @param ptr `usize`
   * @param len `i32`
   * @param salt `u32`
   * @returns `u32`
   */
  export function compute_dom_integrity(ptr: number, len: number, salt: number): number;
  /**
   * wasm/vaultguard-core/assembly/index/compute_pow
   * @param challenge_ptr `usize`
   * @param challenge_len `i32`
   * @param difficulty `u32`
   * @returns `u32`
   */
  export function compute_pow(challenge_ptr: number, challenge_len: number, difficulty: number): number;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
}): Promise<typeof __AdaptedExports>;
