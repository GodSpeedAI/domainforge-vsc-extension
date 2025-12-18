/* tslint:disable */
/* eslint-disable */

export class Dimension {
  free(): void;
  [Symbol.dispose](): void;
  constructor(name: string);
  toString(): string;
}

export class Entity {
  free(): void;
  [Symbol.dispose](): void;
  getAttribute(key: string): any;
  setAttribute(key: string, value: any): void;
  constructor(name: string, namespace?: string | null);
  toJSON(): any;
  readonly id: string;
  readonly name: string;
  readonly namespace: string | undefined;
}

export class EvaluationResult {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Backward-compatible boolean result (false if evaluation is NULL)
   */
  readonly isSatisfied: boolean;
  /**
   * Three-valued result: true, false, or undefined (NULL)
   * Note: In WASM, Option<bool> where None becomes undefined in JS
   */
  readonly isSatisfiedTristate: boolean | undefined;
  /**
   * List of violations
   */
  readonly violations: Violation[];
}

export class Flow {
  free(): void;
  [Symbol.dispose](): void;
  getAttribute(key: string): any;
  setAttribute(key: string, value: any): void;
  constructor(resource_id: string, from_id: string, to_id: string, quantity: string, namespace?: string | null);
  toJSON(): any;
  readonly resourceId: string;
  readonly id: string;
  readonly toId: string;
  readonly fromId: string;
  readonly quantity: string;
  readonly namespace: string | undefined;
}

export class Graph {
  free(): void;
  [Symbol.dispose](): void;
  addEntity(entity: Entity): void;
  addPolicy(policy: any): void;
  flowCount(): number;
  flowsFrom(entity_id: string): any;
  getEntity(id: string): Entity | undefined;
  hasEntity(id: string): boolean;
  exportCalm(): string;
  static importCalm(calm_json: string): Graph;
  removeFlow(id: string): Flow;
  addInstance(instance: Instance): void;
  addResource(resource: Resource): void;
  allEntities(): any;
  entityCount(): number;
  getInstance(id: string): Instance | undefined;
  getResource(id: string): Resource | undefined;
  hasInstance(id: string): boolean;
  hasResource(id: string): boolean;
  allInstances(): any;
  allResources(): any;
  pattern_count(): number;
  removeEntity(id: string): Entity;
  instanceCount(): number;
  resourceCount(): number;
  addAssociation(owner: string, owned: string, rel_type: string): void;
  evaluatePolicy(policy_json: string): EvaluationResult;
  /**
   * Export the graph to Protobuf .proto text format.
   *
   * @param package - The Protobuf package name (e.g., "com.example.api")
   * @param namespace - Optional namespace filter (undefined/null = all namespaces)
   * @param projectionName - Optional name for the projection (used in comments)
   * @param includeGovernance - Whether to include governance messages
   * @param includeServices - Whether to generate gRPC service definitions from Flow patterns
   * @returns The generated .proto file content as a string
   */
  exportProtobuf(_package: string, namespace?: string | null, projection_name?: string | null, include_governance?: boolean | null, include_services?: boolean | null): string;
  removeInstance(id: string): Instance;
  removeResource(id: string): Resource;
  upstreamEntities(entity_id: string): any;
  downstreamEntities(entity_id: string): any;
  findEntityByName(name: string): string | undefined;
  /**
   * Set the evaluation mode for policy evaluation.
   * When `useThreeValuedLogic` is true, policies will use three-valued logic (true, false, null).
   * When false, policies will use strict boolean logic (true, false).
   */
  setEvaluationMode(use_three_valued_logic: boolean): void;
  findResourceByName(name: string): string | undefined;
  /**
   * Get the current evaluation mode.
   * Returns true if three-valued logic is enabled, false otherwise.
   */
  useThreeValuedLogic(): boolean;
  constructor();
  static parse(source: string): Graph;
  toJSON(): any;
  addFlow(flow: Flow): void;
  flowsTo(entity_id: string): any;
  getFlow(id: string): Flow | undefined;
  hasFlow(id: string): boolean;
  isEmpty(): boolean;
  allFlows(): any;
}

export class Instance {
  free(): void;
  [Symbol.dispose](): void;
  constructor(name: string, entity_type: string, namespace?: string | null);
  toJSON(): any;
  getField(key: string): any;
  setField(key: string, value: any): void;
  readonly entityType: string;
  readonly id: string;
  readonly name: string;
  readonly namespace: string | undefined;
}

export class Resource {
  free(): void;
  [Symbol.dispose](): void;
  getAttribute(key: string): any;
  setAttribute(key: string, value: any): void;
  constructor(name: string, unit: string, namespace?: string | null);
  toJSON(): any;
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly namespace: string | undefined;
}

/**
 * Severity level for policy violations
 */
export enum Severity {
  Error = 0,
  Warning = 1,
  Info = 2,
}

export class Unit {
  free(): void;
  [Symbol.dispose](): void;
  constructor(symbol: string, name: string, dimension: string, base_factor: number, base_unit: string);
  readonly base_factor: number;
  readonly name: string;
  readonly symbol: string;
  readonly base_unit: string;
}

export class Violation {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly name: string;
  readonly message: string;
  readonly severity: Severity;
}

/**
 * Check if SEA-DSL source code is already formatted.
 *
 * @param source - The SEA-DSL source code to check
 * @param indentWidth - Number of spaces per indent level (default: 4)
 * @param useTabs - Use tabs instead of spaces for indentation (default: false)
 * @returns True if the source is already formatted, false otherwise
 * @throws Error if the source code cannot be parsed
 *
 * @example
 * ```javascript
 * import { checkFormat } from '@domainforge/sea-wasm';
 *
 * console.log(checkFormat('Entity "Foo" in bar\n')); // true
 * console.log(checkFormat('Entity   "Foo"  in    bar')); // false
 * ```
 */
export function checkFormat(source: string, indent_width?: number | null, use_tabs?: boolean | null): boolean;

/**
 * Format SEA-DSL source code.
 *
 * @param source - The SEA-DSL source code to format
 * @param indentWidth - Number of spaces per indent level (default: 4)
 * @param useTabs - Use tabs instead of spaces for indentation (default: false)
 * @param preserveComments - Preserve comments in output (default: true)
 * @param sortImports - Sort imports alphabetically (default: true)
 * @returns The formatted source code
 * @throws Error if the source code cannot be parsed
 *
 * @example
 * ```javascript
 * import { formatSource } from '@domainforge/sea-wasm';
 *
 * const formatted = formatSource('Entity   "Foo"  in    bar');
 * console.log(formatted); // Entity "Foo" in bar
 * ```
 */
export function formatSource(source: string, indent_width?: number | null, use_tabs?: boolean | null, preserve_comments?: boolean | null, sort_imports?: boolean | null): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_dimension_free: (a: number, b: number) => void;
  readonly __wbg_entity_free: (a: number, b: number) => void;
  readonly __wbg_evaluationresult_free: (a: number, b: number) => void;
  readonly __wbg_flow_free: (a: number, b: number) => void;
  readonly __wbg_get_evaluationresult_isSatisfied: (a: number) => number;
  readonly __wbg_get_evaluationresult_isSatisfiedTristate: (a: number) => number;
  readonly __wbg_get_evaluationresult_violations: (a: number, b: number) => void;
  readonly __wbg_get_violation_message: (a: number, b: number) => void;
  readonly __wbg_get_violation_name: (a: number, b: number) => void;
  readonly __wbg_get_violation_severity: (a: number) => number;
  readonly __wbg_graph_free: (a: number, b: number) => void;
  readonly __wbg_instance_free: (a: number, b: number) => void;
  readonly __wbg_resource_free: (a: number, b: number) => void;
  readonly __wbg_unit_free: (a: number, b: number) => void;
  readonly __wbg_violation_free: (a: number, b: number) => void;
  readonly checkFormat: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly dimension_new: (a: number, b: number) => number;
  readonly dimension_toString: (a: number, b: number) => void;
  readonly entity_getAttribute: (a: number, b: number, c: number) => number;
  readonly entity_id: (a: number, b: number) => void;
  readonly entity_name: (a: number, b: number) => void;
  readonly entity_namespace: (a: number, b: number) => void;
  readonly entity_new: (a: number, b: number, c: number, d: number) => number;
  readonly entity_setAttribute: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly entity_toJSON: (a: number, b: number) => void;
  readonly flow_fromId: (a: number, b: number) => void;
  readonly flow_getAttribute: (a: number, b: number, c: number) => number;
  readonly flow_id: (a: number, b: number) => void;
  readonly flow_namespace: (a: number, b: number) => void;
  readonly flow_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly flow_quantity: (a: number, b: number) => void;
  readonly flow_resourceId: (a: number, b: number) => void;
  readonly flow_setAttribute: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly flow_toId: (a: number, b: number) => void;
  readonly flow_toJSON: (a: number, b: number) => void;
  readonly formatSource: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly graph_addAssociation: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly graph_addEntity: (a: number, b: number, c: number) => void;
  readonly graph_addFlow: (a: number, b: number, c: number) => void;
  readonly graph_addInstance: (a: number, b: number, c: number) => void;
  readonly graph_addPolicy: (a: number, b: number, c: number) => void;
  readonly graph_addResource: (a: number, b: number, c: number) => void;
  readonly graph_allEntities: (a: number, b: number) => void;
  readonly graph_allFlows: (a: number, b: number) => void;
  readonly graph_allInstances: (a: number, b: number) => void;
  readonly graph_allResources: (a: number, b: number) => void;
  readonly graph_downstreamEntities: (a: number, b: number, c: number, d: number) => void;
  readonly graph_entityCount: (a: number) => number;
  readonly graph_evaluatePolicy: (a: number, b: number, c: number, d: number) => void;
  readonly graph_exportCalm: (a: number, b: number) => void;
  readonly graph_exportProtobuf: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly graph_findEntityByName: (a: number, b: number, c: number, d: number) => void;
  readonly graph_findResourceByName: (a: number, b: number, c: number, d: number) => void;
  readonly graph_flowCount: (a: number) => number;
  readonly graph_flowsFrom: (a: number, b: number, c: number, d: number) => void;
  readonly graph_flowsTo: (a: number, b: number, c: number, d: number) => void;
  readonly graph_getEntity: (a: number, b: number, c: number, d: number) => void;
  readonly graph_getFlow: (a: number, b: number, c: number, d: number) => void;
  readonly graph_getInstance: (a: number, b: number, c: number, d: number) => void;
  readonly graph_getResource: (a: number, b: number, c: number, d: number) => void;
  readonly graph_hasEntity: (a: number, b: number, c: number, d: number) => void;
  readonly graph_hasFlow: (a: number, b: number, c: number, d: number) => void;
  readonly graph_hasInstance: (a: number, b: number, c: number, d: number) => void;
  readonly graph_hasResource: (a: number, b: number, c: number, d: number) => void;
  readonly graph_importCalm: (a: number, b: number, c: number) => void;
  readonly graph_instanceCount: (a: number) => number;
  readonly graph_isEmpty: (a: number) => number;
  readonly graph_new: () => number;
  readonly graph_parse: (a: number, b: number, c: number) => void;
  readonly graph_pattern_count: (a: number) => number;
  readonly graph_removeEntity: (a: number, b: number, c: number, d: number) => void;
  readonly graph_removeFlow: (a: number, b: number, c: number, d: number) => void;
  readonly graph_removeInstance: (a: number, b: number, c: number, d: number) => void;
  readonly graph_removeResource: (a: number, b: number, c: number, d: number) => void;
  readonly graph_resourceCount: (a: number) => number;
  readonly graph_setEvaluationMode: (a: number, b: number) => void;
  readonly graph_toJSON: (a: number, b: number) => void;
  readonly graph_upstreamEntities: (a: number, b: number, c: number, d: number) => void;
  readonly graph_useThreeValuedLogic: (a: number) => number;
  readonly instance_entityType: (a: number, b: number) => void;
  readonly instance_getField: (a: number, b: number, c: number) => number;
  readonly instance_id: (a: number, b: number) => void;
  readonly instance_name: (a: number, b: number) => void;
  readonly instance_namespace: (a: number, b: number) => void;
  readonly instance_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly instance_setField: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly instance_toJSON: (a: number, b: number) => void;
  readonly resource_getAttribute: (a: number, b: number, c: number) => number;
  readonly resource_id: (a: number, b: number) => void;
  readonly resource_name: (a: number, b: number) => void;
  readonly resource_namespace: (a: number, b: number) => void;
  readonly resource_new: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly resource_setAttribute: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly resource_toJSON: (a: number, b: number) => void;
  readonly resource_unit: (a: number, b: number) => void;
  readonly unit_base_factor: (a: number) => number;
  readonly unit_base_unit: (a: number, b: number) => void;
  readonly unit_name: (a: number, b: number) => void;
  readonly unit_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly unit_symbol: (a: number, b: number) => void;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export3: (a: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
