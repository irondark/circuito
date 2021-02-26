const Grid = ({width, height, blockSnapSize, zIndex}) => {
    let gridLayer = new Konva.Layer();
    let padding = blockSnapSize;
  
    function getLayer() {
      return gridLayer;
    }
  
    function draw() {
      for (let i = 0; i < width / padding; i++) {
        gridLayer.add(new Konva.Line({
          points: [Math.round(i * padding) + 0.5, 0, Math.round(i * padding) + 0.5, height],
          stroke: '#ddd',
          strokeWidth: 1,
        }));
      }
  
      gridLayer.add(new Konva.Line({points: [0, 0, 10, 10]}));
  
      for (let j = 0; j < height / padding; j++) {
        gridLayer.add(new Konva.Line({
          points: [0, Math.round(j * padding), width, Math.round(j * padding)],
          stroke: '#ddd',
          strokeWidth: 0.5,
        }));
      }
  
      gridLayer.zIndex(zIndex);
      gridLayer.draw();
    }
  
    function clear() {
      gridLayer.find('Line').destroy();
      gridLayer.draw();
    }
  
    return {
      draw,
      clear,
      getLayer,
    };
  }