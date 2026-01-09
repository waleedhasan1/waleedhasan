'use client'

import { useState, useRef, useEffect } from 'react';

export default function PaintAppInline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentTool, setCurrentTool] = useState<'pencil' | 'brush' | 'eraser' | 'fill'>('pencil');
  const [brushSize, setBrushSize] = useState(2);

  const colors = [
    '#000000', '#FFFFFF', '#808080', '#C0C0C0',
    '#FF0000', '#800000', '#FFFF00', '#808000',
    '#00FF00', '#008000', '#00FFFF', '#008080',
    '#0000FF', '#000080', '#FF00FF', '#800080'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (currentTool === 'fill') {
      floodFill(x, y);
      return;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'fill') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
    ctx.lineWidth = currentTool === 'brush' ? brushSize * 2 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const floodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const targetColor = getPixelColor(imageData, startX, startY);
    const fillColor = hexToRgb(currentColor);
    
    if (colorsMatch(targetColor, fillColor)) return;
    
    const pixelStack: [number, number][] = [[startX, startY]];
    
    while (pixelStack.length > 0) {
      const [x, y] = pixelStack.pop()!;
      
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      
      const currentColor = getPixelColor(imageData, x, y);
      
      if (!colorsMatch(currentColor, targetColor)) continue;
      
      setPixelColor(imageData, x, y, fillColor);
      
      pixelStack.push([x + 1, y]);
      pixelStack.push([x - 1, y]);
      pixelStack.push([x, y + 1]);
      pixelStack.push([x, y - 1]);
    }
    
    ctx.putImageData(imageData, 0, 0);
  };

  const getPixelColor = (imageData: ImageData, x: number, y: number) => {
    const index = (y * imageData.width + x) * 4;
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3]
    };
  };

  const setPixelColor = (imageData: ImageData, x: number, y: number, color: { r: number; g: number; b: number }) => {
    const index = (y * imageData.width + x) * 4;
    imageData.data[index] = color.r;
    imageData.data[index + 1] = color.g;
    imageData.data[index + 2] = color.b;
    imageData.data[index + 3] = 255;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const colorsMatch = (a: { r: number; g: number; b: number; a?: number }, b: { r: number; g: number; b: number }) => {
    return a.r === b.r && a.g === b.g && a.b === b.b;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ 
      height: '100%', 
      background: '#008080',
      padding: 8,
      fontFamily: 'MS Sans Serif, Arial, sans-serif',
      fontSize: 11
    }}>
      {/* Toolbar */}
      <div style={{
        background: '#C0C0C0',
        border: '2px outset #DFDFDF',
        padding: 4,
        marginBottom: 8,
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
      }}>
        {/* Tools */}
        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => setCurrentTool('pencil')}
            style={{
              background: '#C0C0C0',
              border: currentTool === 'pencil' ? '2px inset #DFDFDF' : '2px outset #DFDFDF',
              padding: '4px 8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 11
            }}
          >
            ✏️ Pencil
          </button>
          <button
            onClick={() => setCurrentTool('brush')}
            style={{
              background: '#C0C0C0',
              border: currentTool === 'brush' ? '2px inset #DFDFDF' : '2px outset #DFDFDF',
              padding: '4px 8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 11
            }}
          >
            🖌️ Brush
          </button>
          <button
            onClick={() => setCurrentTool('eraser')}
            style={{
              background: '#C0C0C0',
              border: currentTool === 'eraser' ? '2px inset #DFDFDF' : '2px outset #DFDFDF',
              padding: '4px 8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 11
            }}
          >
            🧹 Eraser
          </button>
          <button
            onClick={() => setCurrentTool('fill')}
            style={{
              background: '#C0C0C0',
              border: currentTool === 'fill' ? '2px inset #DFDFDF' : '2px outset #DFDFDF',
              padding: '4px 8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 11
            }}
          >
            🪣 Fill
          </button>
        </div>

        {/* Brush Size */}
        <div style={{ 
          background: '#C0C0C0',
          border: '2px inset #DFDFDF',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <span style={{ fontWeight: 'bold' }}>Size:</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: 60 }}
          />
          <span>{brushSize}px</span>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearCanvas}
          style={{
            background: '#C0C0C0',
            border: '2px outset #DFDFDF',
            padding: '4px 8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 11
          }}
          onMouseDown={(e) => e.currentTarget.style.border = '2px inset #DFDFDF'}
          onMouseUp={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
        >
          🗑️ Clear
        </button>
      </div>

      {/* Color Palette */}
      <div style={{
        background: '#C0C0C0',
        border: '2px outset #DFDFDF',
        padding: 8,
        marginBottom: 8,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 'bold' }}>Colors:</span>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                style={{
                  width: 24,
                  height: 24,
                  background: color,
                  border: currentColor === color ? '2px solid #000000' : '2px outset #DFDFDF',
                  cursor: 'pointer',
                  boxShadow: currentColor === color ? 'inset 0 0 0 2px white' : 'none'
                }}
              />
            ))}
          </div>
          <div style={{
            background: '#C0C0C0',
            border: '2px inset #DFDFDF',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <span style={{ fontWeight: 'bold' }}>Current:</span>
            <div style={{
              width: 32,
              height: 24,
              background: currentColor,
              border: '1px solid #000'
            }} />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{
        background: '#C0C0C0',
        border: '2px inset #DFDFDF',
        padding: 8,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
        display: 'inline-block'
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            border: '1px solid #000',
            cursor: currentTool === 'fill' ? 'crosshair' : 'crosshair',
            background: 'white'
          }}
        />
      </div>
    </div>
  );
}