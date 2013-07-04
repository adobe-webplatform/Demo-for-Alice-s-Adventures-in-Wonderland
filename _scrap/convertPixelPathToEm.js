function convertPixelPathToEm(path){
  return path.trim().split(/,\s?/).map(function(pair){
    return pair.trim().split(/\s+/).map(function(value){ 
      value = parseInt(value, 10);
      value = (value === 0) ? 0 : (value / 16).toFixed(2)
      return value + 'em'
    }).join(' ')
  }).join(', ')
}

var pxString = '99px 0px, 39px 71px, 60px 112px, 43px 154px, 117px 179px, 481px 0px, 99px 0px'
var emString = convertPixelPathToEm(pxString)

console.log(emString)