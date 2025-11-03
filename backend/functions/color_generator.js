//color array
//ensure these colors aren't too light or too dark -> standardize colors
const colors = [
    "#4287f5", //sky blue
    "#0800ff", //blue
    "#7700ff", //indigo-purple
    "#cc00ff", //purple
    "#e47aff", //lavender
    "#f202fa", //magenta
]


//get random color for tags
function generateColor() {
    return  colors[Math.random() % colors.length];
}


module.exports = generateColor;
