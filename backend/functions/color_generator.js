//color array
//ensure these colors aren't too light or too dark -> standardize colors
const colors = [
    "#E33D32", //red
    "#FF5D5D", //red salmon
    "#FF8737", //orange
    "#FFB350", //lighter orange but still orange
    "#4BD276", //green
    "#3CD399", //mint
    "#44CBDA", //cyan
    "#5294DF", //blue
    "#9E5DDE", //indigo purple color
    "#E466CF", //magenta
    "#EA3D7F", //pink
]


//get random color for tags
function generateColor() {
    return  colors[Math.floor(Math.random() * colors.length)];
}


module.exports = { generateColor };
