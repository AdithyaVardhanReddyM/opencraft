/**
 * Selector Generator
 *
 * Utilities for generating unique CSS selectors that target specific elements.
 * Used to ensure style changes only affect the intended element, even when
 * multiple elements share the same class or are rendered in loops.
 */

import type { SelectedElementInfo } from "./types";

// ============================================================================
// Types
// ============================================================================

/**
 * Confidence level of the generated selector
 */
export type SelectorConfidence = "high" | "medium" | "low";

/**
 * Method used to generate the selector
 */
export type SelectorMethod = "id" | "data-attr" | "nth-child" | "path";

/**
 * Result of selector generation
 */
export interface UniqueSelector {
  selector: string;
  confidence: SelectorConfidence;
  method: SelectorMethod;
}

// ============================================================================
// Selector Generation
// ============================================================================

/**
 * Generate a unique CSS selector for an element based on its info
 */
export function generateUniqueSelector(
  element: SelectedElementInfo
): UniqueSelector {
  // Priority 1: ID-based selector (highest confidence)
  if (element.id) {
    return {
      selector: `#${escapeSelector(element.id)}`,
      confidence: "high",
      method: "id",
    };
  }

  // Priority 2: data-testid attribute
  if (element.dataAttributes?.testid) {
    return {
      selector: `[data-testid="${escapeAttrValue(
        element.dataAttributes.testid
      )}"]`,
      confidence: "high",
      method: "data-attr",
    };
  }

  // Priority 3: data-id attribute
  if (element.dataAttributes?.id) {
    return {
      selector: `[data-id="${escapeAttrValue(element.dataAttributes.id)}"]`,
      confidence: "high",
      method: "data-attr",
    };
  }

  // Priority 4: Use element path with nth-of-type
  const pathSelector = generatePathSelector(element);
  if (pathSelector) {
    return {
      selector: pathSelector,
      confidence: "medium",
      method: "path",
    };
  }

  // Fallback: Use element path as-is
  return {
    selector: element.elementPath,
    confidence: "low",
    method: "path",
  };
}

/**
 * Generate a path-based selector using nth-of-type for uniqueness
 */
function generatePathSelector(element: SelectedElementInfo): string | null {
  const { elementPath, siblingIndex, tagName } = element;

  // If the path already contains nth-of-type, use it directly
  if (elementPath.includes(":nth-of-type")) {
    return elementPath;
  }

  // Build a more specific selector using sibling index
  const pathParts = elementPath.split(" > ");
  if (pathParts.length === 0) return null;

  // Add nth-of-type to the last element in the path
  const lastPart = pathParts[pathParts.length - 1];
  const tagPart = lastPart.split(".")[0].split(":")[0]; // Get just the tag name

  // Replace the last part with a more specific selector
  pathParts[pathParts.length - 1] = `${tagPart}:nth-of-type(${
    siblingIndex + 1
  })`;

  return pathParts.join(" > ");
}

/**
 * Escape special characters in CSS selector
 */
function escapeSelector(str: string): string {
  return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
}

/**
 * Escape special characters in attribute value
 */
function escapeAttrValue(str: string): string {
  return str.replace(/"/g, '\\"');
}

// ============================================================================
// Selector Validation
// ============================================================================

/**
 * Validate that a selector uniquely identifies exactly one element
 * This function is meant to be called in the browser context
 */
export function validateSelectorUniqueness(
  selector: string,
  document: Document
): boolean {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1;
  } catch {
    // Invalid selector
    return false;
  }
}

/**
 * Find the best selector from multiple candidates
 */
export function findBestSelector(
  candidates: UniqueSelector[],
  document: Document
): UniqueSelector | null {
  // Sort by confidence (high > medium > low)
  const sorted = [...candidates].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });

  // Return the first one that uniquely identifies an element
  for (const candidate of sorted) {
    if (validateSelectorUniqueness(candidate.selector, document)) {
      return candidate;
    }
  }

  return null;
}

// ============================================================================
// Source Code Selector Matching
// ============================================================================

/**
 * Convert a CSS selector to a pattern for finding elements in JSX source code
 * This is used to locate the element in the source file for modification
 */
export function selectorToSourcePattern(
  selector: UniqueSelector
): RegExp | null {
  const { selector: sel, method } = selector;

  switch (method) {
    case "id":
      // Match id="value" or id={'value'} or id={`value`}
      const idValue = sel.replace("#", "").replace(/\\/g, "");
      return new RegExp(
        `id\\s*=\\s*(?:"${escapeRegex(idValue)}"|'${escapeRegex(
          idValue
        )}'|\\{['"\`]${escapeRegex(idValue)}['"\`]\\})`,
        "g"
      );

    case "data-attr":
      // Match data-testid="value" or data-id="value"
      const attrMatch = sel.match(/\[data-(\w+)="([^"]+)"\]/);
      if (attrMatch) {
        const [, attrName, attrValue] = attrMatch;
        return new RegExp(
          `data-${attrName}\\s*=\\s*(?:"${escapeRegex(
            attrValue
          )}"|'${escapeRegex(attrValue)}'|\\{['"\`]${escapeRegex(
            attrValue
          )}['"\`]\\})`,
          "g"
        );
      }
      return null;

    case "path":
    case "nth-child":
      // Path-based selectors are harder to match in source
      // We'll need to use AST parsing for these cases
      return null;

    default:
      return null;
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
