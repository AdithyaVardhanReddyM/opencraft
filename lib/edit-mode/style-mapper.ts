/**
 * Style Mapper Utilities
 *
 * Functions for converting CSS property values to Tailwind CSS classes.
 * Handles font sizes, colors, spacing, border radius, and arbitrary values.
 */

import type { StyleChanges } from "./types";

// ============================================================================
// Mapping Tables
// ============================================================================

/**
 * Font size mapping (px to Tailwind text-* classes)
 */
export const FONT_SIZE_MAP: Record<string, string> = {
  "12": "text-xs",
  "14": "text-sm",
  "16": "text-base",
  "18": "text-lg",
  "20": "text-xl",
  "24": "text-2xl",
  "30": "text-3xl",
  "36": "text-4xl",
  "48": "text-5xl",
  "60": "text-6xl",
  "72": "text-7xl",
  "96": "text-8xl",
  "128": "text-9xl",
};

/**
 * Font size values in ascending order for nearest match
 */
const FONT_SIZE_VALUES = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96, 128];

/**
 * Spacing mapping (px to Tailwind scale values)
 * Maps pixel values to Tailwind spacing scale numbers
 */
export const SPACING_MAP: Record<string, string> = {
  "0": "0",
  "1": "px",
  "2": "0.5",
  "4": "1",
  "6": "1.5",
  "8": "2",
  "10": "2.5",
  "12": "3",
  "14": "3.5",
  "16": "4",
  "20": "5",
  "24": "6",
  "28": "7",
  "32": "8",
  "36": "9",
  "40": "10",
  "44": "11",
  "48": "12",
  "52": "13",
  "56": "14",
  "60": "15",
  "64": "16",
  "72": "18",
  "80": "20",
  "96": "24",
  "112": "28",
  "128": "32",
  "144": "36",
  "160": "40",
  "176": "44",
  "192": "48",
  "208": "52",
  "224": "56",
  "240": "60",
  "256": "64",
  "288": "72",
  "320": "80",
  "384": "96",
};

/**
 * Spacing values in ascending order for nearest match
 */
const SPACING_VALUES = Object.keys(SPACING_MAP)
  .map(Number)
  .sort((a, b) => a - b);

/**
 * Border radius mapping (px to Tailwind rounded-* classes)
 */
export const BORDER_RADIUS_MAP: Record<string, string> = {
  "0": "rounded-none",
  "2": "rounded-sm",
  "4": "rounded",
  "6": "rounded-md",
  "8": "rounded-lg",
  "12": "rounded-xl",
  "16": "rounded-2xl",
  "24": "rounded-3xl",
  "9999": "rounded-full",
};

/**
 * Border radius values in ascending order for nearest match
 */
const BORDER_RADIUS_VALUES = [0, 2, 4, 6, 8, 12, 16, 24, 9999];

/**
 * Font weight mapping (numeric to Tailwind font-* classes)
 */
export const FONT_WEIGHT_MAP: Record<string, string> = {
  "100": "font-thin",
  "200": "font-extralight",
  "300": "font-light",
  "400": "font-normal",
  "500": "font-medium",
  "600": "font-semibold",
  "700": "font-bold",
  "800": "font-extrabold",
  "900": "font-black",
};

/**
 * Common Tailwind color palette for matching
 * Maps hex values to Tailwind color classes
 */
export const COLOR_MAP: Record<string, string> = {
  // Whites and blacks
  "#ffffff": "white",
  "#000000": "black",
  transparent: "transparent",
  // Grays
  "#f9fafb": "gray-50",
  "#f3f4f6": "gray-100",
  "#e5e7eb": "gray-200",
  "#d1d5db": "gray-300",
  "#9ca3af": "gray-400",
  "#6b7280": "gray-500",
  "#4b5563": "gray-600",
  "#374151": "gray-700",
  "#1f2937": "gray-800",
  "#111827": "gray-900",
  // Add more colors as needed
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse a CSS value and extract the numeric part
 */
export function parseNumericValue(value: string): number | null {
  const match = value.match(/^(-?\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Find the nearest value in a sorted array
 */
function findNearestValue(target: number, values: number[]): number {
  let nearest = values[0];
  let minDiff = Math.abs(target - nearest);

  for (const value of values) {
    const diff = Math.abs(target - value);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = value;
    }
  }

  return nearest;
}

/**
 * Convert RGB color to hex
 */
export function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb;

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Normalize a color value to lowercase hex
 */
export function normalizeColor(value: string): string {
  const trimmed = value.trim().toLowerCase();

  // Handle rgb/rgba
  if (trimmed.startsWith("rgb")) {
    return rgbToHex(trimmed);
  }

  // Handle hex
  if (trimmed.startsWith("#")) {
    // Expand shorthand hex (#fff -> #ffffff)
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    return trimmed;
  }

  return trimmed;
}

// ============================================================================
// Conversion Functions
// ============================================================================

/**
 * Convert font size CSS value to Tailwind class
 */
export function fontSizeToTailwind(value: string): string {
  const numValue = parseNumericValue(value);
  if (numValue === null) {
    // Return arbitrary value for non-numeric
    return `text-[${value}]`;
  }

  // Find nearest standard font size
  const nearest = findNearestValue(numValue, FONT_SIZE_VALUES);
  const tailwindClass = FONT_SIZE_MAP[String(nearest)];

  // If exact match or close enough (within 2px), use standard class
  if (tailwindClass && Math.abs(numValue - nearest) <= 2) {
    return tailwindClass;
  }

  // Use arbitrary value for non-standard sizes
  return `text-[${Math.round(numValue)}px]`;
}

/**
 * Convert color CSS value to Tailwind class
 */
export function colorToTailwind(
  value: string,
  property: "text" | "bg" | "border"
): string {
  const normalized = normalizeColor(value);

  // Check for exact match in color map
  const colorClass = COLOR_MAP[normalized];
  if (colorClass) {
    return `${property}-${colorClass}`;
  }

  // Handle transparent
  if (normalized === "transparent" || normalized === "rgba(0, 0, 0, 0)") {
    return `${property}-transparent`;
  }

  // Use arbitrary value for custom colors
  return `${property}-[${normalized}]`;
}

/**
 * Convert spacing CSS value to Tailwind class
 */
export function spacingToTailwind(value: string, property: string): string {
  const numValue = parseNumericValue(value);

  // Handle auto
  if (value.trim().toLowerCase() === "auto") {
    return `${property}-auto`;
  }

  if (numValue === null) {
    return `${property}-[${value}]`;
  }

  // Handle 0
  if (numValue === 0) {
    return `${property}-0`;
  }

  // Find nearest standard spacing
  const nearest = findNearestValue(numValue, SPACING_VALUES);
  const tailwindScale = SPACING_MAP[String(nearest)];

  // If exact match or close enough (within 2px), use standard class
  if (tailwindScale && Math.abs(numValue - nearest) <= 2) {
    return `${property}-${tailwindScale}`;
  }

  // Use arbitrary value for non-standard spacing
  return `${property}-[${Math.round(numValue)}px]`;
}

/**
 * Convert border radius CSS value to Tailwind class
 */
export function borderRadiusToTailwind(value: string): string {
  const numValue = parseNumericValue(value);

  if (numValue === null) {
    return `rounded-[${value}]`;
  }

  // Handle 0
  if (numValue === 0) {
    return "rounded-none";
  }

  // Handle very large values (full/pill)
  if (numValue >= 9999 || value.includes("9999")) {
    return "rounded-full";
  }

  // Find nearest standard border radius
  const nearest = findNearestValue(numValue, BORDER_RADIUS_VALUES);
  const tailwindClass = BORDER_RADIUS_MAP[String(nearest)];

  // If exact match or close enough (within 2px), use standard class
  if (tailwindClass && Math.abs(numValue - nearest) <= 2) {
    return tailwindClass;
  }

  // Use arbitrary value for non-standard radius
  return `rounded-[${Math.round(numValue)}px]`;
}

/**
 * Convert font weight CSS value to Tailwind class
 */
export function fontWeightToTailwind(value: string): string {
  const normalized = value.trim();

  // Check for exact match
  const tailwindClass = FONT_WEIGHT_MAP[normalized];
  if (tailwindClass) {
    return tailwindClass;
  }

  // Handle named weights
  const namedWeights: Record<string, string> = {
    normal: "font-normal",
    bold: "font-bold",
    lighter: "font-light",
    bolder: "font-bold",
  };

  if (namedWeights[normalized.toLowerCase()]) {
    return namedWeights[normalized.toLowerCase()];
  }

  // Use arbitrary value
  return `font-[${normalized}]`;
}

/**
 * Convert opacity CSS value to Tailwind class
 */
export function opacityToTailwind(value: string): string {
  const numValue = parseNumericValue(value);

  if (numValue === null) {
    return `opacity-[${value}]`;
  }

  // Convert to percentage (0-100)
  const percentage = Math.round(numValue * 100);

  // Standard opacity values
  const standardOpacities = [
    0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
    95, 100,
  ];

  // Find nearest
  const nearest = findNearestValue(percentage, standardOpacities);

  if (Math.abs(percentage - nearest) <= 2) {
    return `opacity-${nearest}`;
  }

  return `opacity-[${percentage}%]`;
}

// ============================================================================
// Main Conversion Function
// ============================================================================

/**
 * CSS property to Tailwind prefix mapping
 */
const PROPERTY_PREFIX_MAP: Record<string, string> = {
  width: "w",
  height: "h",
  padding: "p",
  paddingTop: "pt",
  paddingRight: "pr",
  paddingBottom: "pb",
  paddingLeft: "pl",
  margin: "m",
  marginTop: "mt",
  marginRight: "mr",
  marginBottom: "mb",
  marginLeft: "ml",
  gap: "gap",
};

/**
 * Convert a StyleChanges object to an array of Tailwind classes
 */
export function cssToTailwind(styles: StyleChanges): string[] {
  const classes: string[] = [];

  for (const [property, value] of Object.entries(styles)) {
    if (!value || value === "initial" || value === "inherit") continue;

    let tailwindClass: string | null = null;

    switch (property) {
      case "fontSize":
        tailwindClass = fontSizeToTailwind(value);
        break;

      case "fontWeight":
        tailwindClass = fontWeightToTailwind(value);
        break;

      case "color":
        tailwindClass = colorToTailwind(value, "text");
        break;

      case "backgroundColor":
        tailwindClass = colorToTailwind(value, "bg");
        break;

      case "borderColor":
        tailwindClass = colorToTailwind(value, "border");
        break;

      case "borderRadius":
        tailwindClass = borderRadiusToTailwind(value);
        break;

      case "opacity":
        tailwindClass = opacityToTailwind(value);
        break;

      case "width":
      case "height":
      case "padding":
      case "paddingTop":
      case "paddingRight":
      case "paddingBottom":
      case "paddingLeft":
      case "margin":
      case "marginTop":
      case "marginRight":
      case "marginBottom":
      case "marginLeft":
      case "gap":
        const prefix = PROPERTY_PREFIX_MAP[property];
        if (prefix) {
          tailwindClass = spacingToTailwind(value, prefix);
        }
        break;

      case "display":
        // Handle common display values
        const displayMap: Record<string, string> = {
          block: "block",
          inline: "inline",
          "inline-block": "inline-block",
          flex: "flex",
          "inline-flex": "inline-flex",
          grid: "grid",
          "inline-grid": "inline-grid",
          hidden: "hidden",
          none: "hidden",
        };
        tailwindClass = displayMap[value.toLowerCase()] || null;
        break;

      case "flexDirection":
        const flexDirMap: Record<string, string> = {
          row: "flex-row",
          "row-reverse": "flex-row-reverse",
          column: "flex-col",
          "column-reverse": "flex-col-reverse",
        };
        tailwindClass = flexDirMap[value.toLowerCase()] || null;
        break;

      case "justifyContent":
        const justifyMap: Record<string, string> = {
          "flex-start": "justify-start",
          "flex-end": "justify-end",
          center: "justify-center",
          "space-between": "justify-between",
          "space-around": "justify-around",
          "space-evenly": "justify-evenly",
        };
        tailwindClass = justifyMap[value.toLowerCase()] || null;
        break;

      case "alignItems":
        const alignMap: Record<string, string> = {
          "flex-start": "items-start",
          "flex-end": "items-end",
          center: "items-center",
          baseline: "items-baseline",
          stretch: "items-stretch",
        };
        tailwindClass = alignMap[value.toLowerCase()] || null;
        break;

      case "textAlign":
        const textAlignMap: Record<string, string> = {
          left: "text-left",
          center: "text-center",
          right: "text-right",
          justify: "text-justify",
        };
        tailwindClass = textAlignMap[value.toLowerCase()] || null;
        break;

      default:
        // Skip unknown properties
        break;
    }

    if (tailwindClass) {
      classes.push(tailwindClass);
    }
  }

  return classes;
}

// ============================================================================
// Class Name Update Function
// ============================================================================

/**
 * Extract class prefixes from Tailwind classes for conflict detection
 */
function extractClassPrefixes(classes: string[]): Set<string> {
  return new Set(
    classes.map((cls) => {
      // Extract prefix (e.g., "text" from "text-lg", "p" from "p-4")
      const match = cls.match(/^([a-z]+)-/);
      return match ? match[1] : cls;
    })
  );
}

/**
 * Find the element in source code by selector and return its position
 * Returns the position of the element's opening tag
 */
function findElementBySelector(
  sourceCode: string,
  selector: string
): { start: number; end: number } | null {
  // Handle ID selector: #myId
  if (selector.startsWith("#")) {
    const id = selector.slice(1);
    // Match id="value" or id={'value'} or id={`value`}
    const idRegex = new RegExp(
      `id\\s*=\\s*(?:"${escapeRegexChars(id)}"|'${escapeRegexChars(
        id
      )}'|\\{['"\`]${escapeRegexChars(id)}['"\`]\\})`,
      "g"
    );
    const match = idRegex.exec(sourceCode);
    if (match) {
      // Find the start of the element (look backwards for <)
      let start = match.index;
      while (start > 0 && sourceCode[start] !== "<") {
        start--;
      }
      // Find the end of the opening tag
      let end = match.index + match[0].length;
      while (end < sourceCode.length && sourceCode[end] !== ">") {
        end++;
      }
      return { start, end: end + 1 };
    }
  }

  // Handle data attribute selector: [data-testid="value"]
  const dataAttrMatch = selector.match(/\[data-(\w+)="([^"]+)"\]/);
  if (dataAttrMatch) {
    const [, attrName, attrValue] = dataAttrMatch;
    const attrRegex = new RegExp(
      `data-${attrName}\\s*=\\s*(?:"${escapeRegexChars(
        attrValue
      )}"|'${escapeRegexChars(attrValue)}'|\\{['"\`]${escapeRegexChars(
        attrValue
      )}['"\`]\\})`,
      "g"
    );
    const match = attrRegex.exec(sourceCode);
    if (match) {
      let start = match.index;
      while (start > 0 && sourceCode[start] !== "<") {
        start--;
      }
      let end = match.index + match[0].length;
      while (end < sourceCode.length && sourceCode[end] !== ">") {
        end++;
      }
      return { start, end: end + 1 };
    }
  }

  return null;
}

/**
 * Escape special regex characters
 */
function escapeRegexChars(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Update className in JSX/TSX source code with new Tailwind classes.
 * Preserves existing classes that don't conflict with new ones.
 *
 * @param sourceCode - The source code to modify
 * @param elementSelector - CSS selector or element path to identify the element
 * @param newClasses - Array of new Tailwind classes to add
 */
export function updateElementClassName(
  sourceCode: string,
  elementSelector: string,
  newClasses: string[]
): string {
  const newPrefixes = extractClassPrefixes(newClasses);

  // Try to find element by unique selector first
  const elementPos = findElementBySelector(sourceCode, elementSelector);

  if (elementPos) {
    // Found element by unique selector - update only this element
    const elementTag = sourceCode.slice(elementPos.start, elementPos.end);

    // Find className in this specific element
    const classNameRegex =
      /className\s*=\s*(?:"([^"]*)"|'([^']*)'|{`([^`]*)`})/;
    const match = classNameRegex.exec(elementTag);

    if (match) {
      const existingClasses = (match[1] || match[2] || match[3] || "")
        .split(/\s+/)
        .filter(Boolean);

      // Filter out conflicting classes
      const filteredClasses = existingClasses.filter((cls) => {
        const prefix = cls.match(/^([a-z]+)-/)?.[1] || cls;
        return !newPrefixes.has(prefix);
      });

      // Combine filtered existing classes with new classes
      const combinedClasses = [...filteredClasses, ...newClasses].join(" ");

      // Determine quote style
      const fullMatch = match[0];
      const quote = fullMatch.includes('"')
        ? '"'
        : fullMatch.includes("'")
        ? "'"
        : "`";
      const newClassName =
        quote === "`"
          ? `className={\`${combinedClasses}\`}`
          : `className=${quote}${combinedClasses}${quote}`;

      // Replace only in this element
      const updatedTag = elementTag.replace(fullMatch, newClassName);
      return (
        sourceCode.slice(0, elementPos.start) +
        updatedTag +
        sourceCode.slice(elementPos.end)
      );
    } else {
      // No className found, add one before the closing >
      const insertPos = elementPos.end - 1;
      const newClassName = `className="${newClasses.join(" ")}"`;
      return (
        sourceCode.slice(0, insertPos) +
        ` ${newClassName}` +
        sourceCode.slice(insertPos)
      );
    }
  }

  // Fallback: Update first matching className (legacy behavior)
  // This is less precise but maintains backward compatibility
  console.warn(
    "[style-mapper] Could not find element by selector, using fallback"
  );

  const classNameRegex = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|{`([^`]*)`})/;
  const match = classNameRegex.exec(sourceCode);

  if (match) {
    const existingClasses = (match[1] || match[2] || match[3] || "")
      .split(/\s+/)
      .filter(Boolean);

    const filteredClasses = existingClasses.filter((cls) => {
      const prefix = cls.match(/^([a-z]+)-/)?.[1] || cls;
      return !newPrefixes.has(prefix);
    });

    const combinedClasses = [...filteredClasses, ...newClasses].join(" ");

    const fullMatch = match[0];
    const quote = fullMatch.includes('"')
      ? '"'
      : fullMatch.includes("'")
      ? "'"
      : "`";
    const newClassName =
      quote === "`"
        ? `className={\`${combinedClasses}\`}`
        : `className=${quote}${combinedClasses}${quote}`;

    return sourceCode.replace(fullMatch, newClassName);
  }

  return sourceCode;
}

/**
 * Check if a Tailwind class is valid (basic validation)
 */
export function isValidTailwindClass(className: string): boolean {
  // Check for arbitrary value syntax
  if (/^[a-z]+-\[.+\]$/.test(className)) {
    return true;
  }

  // Check for standard class patterns
  if (/^[a-z]+(-[a-z0-9]+)*$/.test(className)) {
    return true;
  }

  return false;
}
