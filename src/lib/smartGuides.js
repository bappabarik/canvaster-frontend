import { fabric } from "fabric";

export function initAligningGuidelines(canvas) {
  const ctx = canvas.getSelectionContext();
  const aligningLineOffset = 6; // How close before it snaps (magnetic pull)
  const aligningLineMargin = 5; // How far the line extends past the objects
  const aligningLineWidth = 1;  // Ultra-thin line
  const aligningLineColor = "#e83e8c"; // Canva Pink

  let viewportTransform;
  let zoom = 1;
  let verticalLines = [];
  let horizontalLines = [];

  function drawLine(x1, y1, x2, y2) {
    ctx.save();
    ctx.lineWidth = aligningLineWidth;
    ctx.strokeStyle = aligningLineColor;
    ctx.setLineDash([4, 4]); // Makes the line dotted like Canva!
    ctx.beginPath();
    
    // Transform logical coordinates to current viewport/zoom coordinates
    ctx.moveTo(x1 * zoom + viewportTransform[4], y1 * zoom + viewportTransform[5]);
    ctx.lineTo(x2 * zoom + viewportTransform[4], y2 * zoom + viewportTransform[5]);
    
    ctx.stroke();
    ctx.restore();
  }

  function getBounds(obj) {
    // Gets absolute bounding box, completely ignoring zoom/pan for zero jitter
    const rect = obj.getBoundingRect(true, true);
    return {
      left: rect.left,
      right: rect.left + rect.width,
      top: rect.top,
      bottom: rect.top + rect.height,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      width: rect.width,
      height: rect.height
    };
  }

  function isInRange(v1, v2) {
    // Adjust magnetic pull strength based on how far user is zoomed in
    return Math.abs(v1 - v2) <= aligningLineOffset / zoom;
  }

  canvas.on("mouse:down", () => {
    viewportTransform = canvas.viewportTransform;
    zoom = canvas.getZoom();
  });

  canvas.on("object:moving", (e) => {
    verticalLines = [];
    horizontalLines = [];

    const activeObject = e.target;
    const canvasObjects = canvas.getObjects();
    const aBounds = getBounds(activeObject);

    let snapX = false;
    let snapY = false;

    // 1. Center of canvas snapping
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    if (isInRange(aBounds.centerX, canvasCenterX)) {
      snapX = true;
      activeObject.setPositionByOrigin(new fabric.Point(canvasCenterX, aBounds.centerY), "center", "center");
      verticalLines.push({ x: canvasCenterX, y1: 0, y2: canvas.height });
    }
    if (isInRange(aBounds.centerY, canvasCenterY)) {
      snapY = true;
      // Re-fetch center X in case it was just snapped vertically
      const currCenterX = activeObject.getCenterPoint().x;
      activeObject.setPositionByOrigin(new fabric.Point(currCenterX, canvasCenterY), "center", "center");
      horizontalLines.push({ y: canvasCenterY, x1: 0, x2: canvas.width });
    }

    // Re-fetch bounds after potential canvas-center snap
    const snappedBounds = getBounds(activeObject);

    // 2. Object to Object snapping
    for (let i = canvasObjects.length; i--; ) {
      if (canvasObjects[i] === activeObject || !canvasObjects[i].visible) continue;

      const oBounds = getBounds(canvasObjects[i]);

      // X Axis Snapping (Vertical Lines)
      if (!snapX) {
        const xPoints = [
          { active: snappedBounds.left, target: oBounds.left, offset: snappedBounds.width / 2 },
          { active: snappedBounds.left, target: oBounds.right, offset: snappedBounds.width / 2 },
          { active: snappedBounds.right, target: oBounds.left, offset: -snappedBounds.width / 2 },
          { active: snappedBounds.right, target: oBounds.right, offset: -snappedBounds.width / 2 },
          { active: snappedBounds.centerX, target: oBounds.centerX, offset: 0 }
        ];

        for (let p of xPoints) {
          if (isInRange(p.active, p.target)) {
            snapX = true;
            activeObject.setPositionByOrigin(new fabric.Point(p.target + p.offset, activeObject.getCenterPoint().y), "center", "center");
            
            // Draw line EXACTLY from top of highest object to bottom of lowest object
            const y1 = Math.min(snappedBounds.top, oBounds.top) - aligningLineMargin;
            const y2 = Math.max(snappedBounds.bottom, oBounds.bottom) + aligningLineMargin;
            verticalLines.push({ x: p.target, y1, y2 });
            break;
          }
        }
      }

      // Y Axis Snapping (Horizontal Lines)
      if (!snapY) {
        const yPoints = [
          { active: snappedBounds.top, target: oBounds.top, offset: snappedBounds.height / 2 },
          { active: snappedBounds.top, target: oBounds.bottom, offset: snappedBounds.height / 2 },
          { active: snappedBounds.bottom, target: oBounds.top, offset: -snappedBounds.height / 2 },
          { active: snappedBounds.bottom, target: oBounds.bottom, offset: -snappedBounds.height / 2 },
          { active: snappedBounds.centerY, target: oBounds.centerY, offset: 0 }
        ];

        for (let p of yPoints) {
          if (isInRange(p.active, p.target)) {
            snapY = true;
            activeObject.setPositionByOrigin(new fabric.Point(activeObject.getCenterPoint().x, p.target + p.offset), "center", "center");
            
            // Draw line EXACTLY from left of leftmost object to right of rightmost object
            const x1 = Math.min(snappedBounds.left, oBounds.left) - aligningLineMargin;
            const x2 = Math.max(snappedBounds.right, oBounds.right) + aligningLineMargin;
            horizontalLines.push({ y: p.target, x1, x2 });
            break;
          }
        }
      }
    }
  });

// 3. Draw the lines *over* the canvas just before it renders
  canvas.on("before:render", () => {
    // FIX: Safety check! Only clear if the interactive top layer exists
    if (canvas.contextTop) {
      canvas.clearContext(canvas.contextTop);
    }
  });

  canvas.on("after:render", () => {
    // FIX: Safety check! Don't try to draw guide lines during a toDataURL() export
    if (!canvas.contextTop) return; 

    for (let i = 0; i < verticalLines.length; i++) {
      drawLine(verticalLines[i].x, verticalLines[i].y1, verticalLines[i].x, verticalLines[i].y2);
    }
    for (let i = 0; i < horizontalLines.length; i++) {
      drawLine(horizontalLines[i].x1, horizontalLines[i].y, horizontalLines[i].x2, horizontalLines[i].y);
    }
  });

  canvas.on("mouse:up", () => {
    verticalLines = [];
    horizontalLines = [];
    canvas.requestRenderAll();
  });
}