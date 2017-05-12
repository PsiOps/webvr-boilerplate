function createTerrain(){
    
    
}

function getTerrainPixelData()
{
  var img = document.getElementById("landscape-image");
  var canvas = document.getElementById("canvas");
  
  canvas.width = img.width;
  canvas.height = img.height;
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height);

  var data = canvas.getContext('2d').getImageData(0,0, img.height, img.width).data;
  var normPixels = []

  for (var i = 0, n = data.length; i < n; i += 4) {
    // get the average value of R, G and B.
    normPixels.push((data[i] + data[i+1] + data[i+2]) / 3);
  }

  return normPixels;
}