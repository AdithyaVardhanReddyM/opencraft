/**
 * Edit Mode Types
 *
 * Type definitions for the Visual Element Editor feature.
 * These types define the state, messages, and data structures used
 * for element selection, style inspection, and modification.
 */

// ============================================================================
// Computed Styles
// ============================================================================

/**
 * Computed CSS styles extracted from a selected element.
 * Organized into typography, layout, and appearance categories.
 */
export interface ComputedStylesInfo {
  // Typography
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  color: string;
  textDecoration: string;
  textTransform: string;

  // Layout
  display: string;
  width: string;
  height: string;
  padding: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  margin: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  gap: string;
  columnGap: string;
  rowGap: string;
  flexDirection: string;
  flexWrap: string;
  justifyContent: string;
  alignItems: string;

  // Appearance
  backgroundColor: string;
  backgroundImage: string;
  borderRadius: string;
  borderTopLeftRadius: string;
  borderTopRightRadius: string;
  borderBottomLeftRadius: string;
  borderBottomRightRadius: string;
  borderWidth: string;
  borderTopWidth: string;
  borderRightWidth: string;
  borderBottomWidth: string;
  borderLeftWidth: string;
  borderColor: string;
  borderStyle: string;
  outlineWidth: string;
  outlineColor: string;
  outlineStyle: string;
  outlineOffset: string;
  boxShadow: string;
  opacity: string;
}

/**
 * List of all computed style property keys for iteration
 */
export const COMPUTED_STYLE_KEYS: (keyof ComputedStylesInfo)[] = [
  // Typography
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "color",
  "textDecoration",
  "textTransform",
  // Layout
  "display",
  "width",
  "height",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "gap",
  "columnGap",
  "rowGap",
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  // Appearance
  "backgroundColor",
  "backgroundImage",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "borderWidth",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderColor",
  "borderStyle",
  "outlineWidth",
  "outlineColor",
  "outlineStyle",
  "outlineOffset",
  "boxShadow",
  "opacity",
];

// ============================================================================
// Element Information
// ============================================================================

/**
 * Information about a hovered element in the sandbox iframe.
 * Used for displaying hover highlights.
 */
export interface HoveredElementInfo {
  tagName: string;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Detailed information about a selected element.
 * Includes computed styles and identification data.
 */
export interface SelectedElementInfo {
  tagName: string;
  className: string;
  id: string; // Element ID attribute
  computedStyles: ComputedStylesInfo;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  elementPath: string; // CSS selector path for identification
  sourceFile?: string; // Source file path if available
  textContent?: string; // Text content for text elements
  uniqueIdentifier: string; // Unique ID for targeting (id, data-attr, or generated)
  siblingIndex: number; // Position among same-tag siblings
  dataAttributes: Record<string, string>; // All data-* attributes
}

// ============================================================================
// Element Categories
// ============================================================================

/**
 * Category of an element for determining which property sections to display
 */
export type ElementCategory = "container" | "text" | "image" | "other";

/**
 * Text elements that should show Typography section
 */
export const TEXT_ELEMENTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "label",
  "a",
  "strong",
  "em",
  "b",
  "i",
  "small",
  "mark",
  "del",
  "ins",
  "sub",
  "sup",
] as const;

/**
 * Container elements that should show Layout section with flex options
 */
export const CONTAINER_ELEMENTS = [
  "div",
  "section",
  "article",
  "main",
  "header",
  "footer",
  "nav",
  "aside",
  "ul",
  "ol",
  "li",
  "form",
  "fieldset",
] as const;

/**
 * Determine the category of an element based on its tag name
 */
export function getElementCategory(tagName: string): ElementCategory {
  const normalizedTag = tagName.toLowerCase();

  if (normalizedTag === "img") return "image";
  if ((TEXT_ELEMENTS as readonly string[]).includes(normalizedTag))
    return "text";
  if ((CONTAINER_ELEMENTS as readonly string[]).includes(normalizedTag))
    return "container";

  return "other";
}

/**
 * Check if an element is a text element
 */
export function isTextElement(tagName: string): boolean {
  return getElementCategory(tagName) === "text";
}

/**
 * Check if an element is a container element
 */
export function isContainerElement(tagName: string): boolean {
  return getElementCategory(tagName) === "container";
}

/**
 * Check if an element is an image element
 */
export function isImageElement(tagName: string): boolean {
  return getElementCategory(tagName) === "image";
}

// ============================================================================
// Style Changes
// ============================================================================

/**
 * Map of CSS property names to their new values.
 * Used to track pending style modifications.
 */
export interface StyleChanges {
  [property: string]: string;
}

// ============================================================================
// Edit Mode State
// ============================================================================

/**
 * Complete state for the edit mode feature.
 */
export interface EditModeState {
  isEditMode: boolean;
  selectedElement: SelectedElementInfo | null;
  hoveredElement: HoveredElementInfo | null;
  pendingChanges: StyleChanges | null;
  isSaving: boolean;
  saveError: string | null;
}

/**
 * Initial state for edit mode
 */
export const initialEditModeState: EditModeState = {
  isEditMode: false,
  selectedElement: null,
  hoveredElement: null,
  pendingChanges: null,
  isSaving: false,
  saveError: null,
};

// ============================================================================
// PostMessage Communication Types
// ============================================================================

/**
 * Messages sent from the parent window to the iframe.
 */
export type ParentToIframeMessage =
  | { type: "enable-edit-mode" }
  | { type: "disable-edit-mode" }
  | { type: "apply-style"; property: string; value: string }
  | { type: "deselect" };

/**
 * Messages sent from the iframe to the parent window.
 */
export type IframeToParentMessage =
  | { type: "element-hovered"; data: HoveredElementInfo }
  | { type: "element-unhovered" }
  | { type: "element-selected"; data: SelectedElementInfo }
  | { type: "element-deselected" }
  | { type: "edit-mode-ready" }
  | { type: "edit-mode-script-loaded" }
  | { type: "edit-mode-error"; error: string };

/**
 * Type guard to check if a message is from the edit mode overlay
 */
export function isEditModeMessage(
  data: unknown
): data is IframeToParentMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as { type?: string };
  return (
    msg.type === "element-hovered" ||
    msg.type === "element-unhovered" ||
    msg.type === "element-selected" ||
    msg.type === "element-deselected" ||
    msg.type === "edit-mode-ready" ||
    msg.type === "edit-mode-script-loaded" ||
    msg.type === "edit-mode-error"
  );
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Request body for enabling edit mode
 */
export interface EnableEditModeRequest {
  sandboxId: string;
}

/**
 * Request body for disabling edit mode
 */
export interface DisableEditModeRequest {
  sandboxId: string;
}

/**
 * Request body for writing a file to the sandbox
 */
export interface WriteFileRequest {
  sandboxId: string;
  path: string;
  content: string;
}

/**
 * Response from edit mode API endpoints
 */
export interface EditModeResponse {
  success: boolean;
  error?: string;
}

/**
 * Response from file write API endpoint
 */
export interface WriteFileResponse {
  success: boolean;
  error?: string;
}
