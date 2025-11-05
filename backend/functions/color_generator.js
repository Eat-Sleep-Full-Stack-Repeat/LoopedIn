//color array
//ensure these colors aren't too light or too dark -> standardize colors
const colors = [
    "#ff0202ff", //red
    "#f74802", //orange
    "#f77502", //lighter orange but still orange
    "#f79502", //yellow-orange
    "#fcba03", //gold
    "#fce303", //yellow
    "#84d904", //lime
    "#09fa05", //green
    "#04cc6b", //teal
    "#04c4b8", //turqoise
    "#00bfe6", //sky blue
    "#4287f5", //ocean blue
    "#0800ff", //blue
    "#7700ff", //indigo-purple
    "#cc00ff", //purple
    "#e47aff", //lavender
    "#f202fa", //magenta
    "#fc03d3", //pink
    "#f779e2", //light pink
    "#f50284", //rose
    "#f75789", //salmon
    "#f70250", //pink-red
]


//get random color for tags
function generateColor() {
    return  colors[Math.floor(Math.random() * colors.length)];
}


module.exports = { generateColor };
