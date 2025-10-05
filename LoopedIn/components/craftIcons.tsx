import { ImageSourcePropType } from "react-native"

type CraftTypes ={
    crochet: ImageSourcePropType;
    knit: ImageSourcePropType;
    sewing: ImageSourcePropType;
}

const craftIcons: CraftTypes = {
    crochet: require("@/assets/images/Ellipse 44.png"),
    knit: require("@/assets/images/Ellipse 44.png"),
    sewing: require("@/assets/images/Ellipse 44.png"),
}

export default craftIcons;