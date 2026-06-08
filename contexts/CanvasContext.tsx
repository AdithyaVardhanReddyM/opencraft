"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useState,
  useCallback,
} from "react";
import type { ViewportState, ShapesState, Shape } from "@/types/canvas";
import {
  viewportReducer,
  initialViewportState,
  type ViewportAction,
} from "@/lib/canvas/viewport-reducer";
import {
  shapesReducer,
  initialShapesState,
  type ShapesAction,
} from "@/lib/canvas/shapes-reducer";
import {
  type ShapeDefaultProperties,
  DEFAULT_SHAPE_PROPERTIES,
} from "@/lib/canvas/properties-utils";

interface CanvasContextValue {
  // Viewport state
  viewport: ViewportState;
  dispatchViewport: React.Dispatch<ViewportAction>;

  // Shapes state
  shapes: ShapesState;
  dispatchShapes: React.Dispatch<ShapesAction>;

  // Computed values
  shapesList: Shape[];

  // Default shape properties
  defaultProperties: ShapeDefaultProperties;
  setDefaultProperty: (property: string, value: unknown) => void;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [viewport, dispatchViewport] = useReducer(
    viewportReducer,
    initialViewportState
  );

  const [shapes, dispatchShapes] = useReducer(
    shapesReducer,
    initialShapesState
  );

  // Default shape properties state
  const [defaultProperties, setDefaultProperties] =
    useState<ShapeDefaultProperties>(DEFAULT_SHAPE_PROPERTIES);

  // Update a single default property
  const setDefaultProperty = useCallback((property: string, value: unknown) => {
    setDefaultProperties((prev) => ({
      ...prev,
      [property]: value,
    }));
  }, []);

  // Compute shapes list from entity state with safety checks
  const shapesList = useMemo(() => {
    // Safety check for invalid shapes state
    if (
      !shapes.shapes ||
      !Array.isArray(shapes.shapes.ids) ||
      !shapes.shapes.entities
    ) {
      return [];
    }

    return shapes.shapes.ids
      .map((id) => shapes.shapes.entities[id])
      .filter((shape): shape is Shape => Boolean(shape));
  }, [shapes.shapes]);

  const value: CanvasContextValue = {
    viewport,
    dispatchViewport,
    shapes,
    dispatchShapes,
    shapesList,
    defaultProperties,
    setDefaultProperty,
  };

  return (
    <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error("useCanvasContext must be used within a CanvasProvider");
  }
  return context;
}
