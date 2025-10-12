interface colorsType {
    warning: string,
    dark: {
        text: string,
        decorativeText: string,
        decorativeBackground: string,
        topBackground: string,
        background: string
    },
    light: {
        text: string,
        decorativeText: string,
        decorativeBackground: string,
        topBackground: string,
        background: string
    }
}

export const Colors = {
    warning: "red",
    dark: {
        text: "#FFFFFF", //main text on page
        decorativeText: "#FFFFFF", //white text in circles
        decorativeBackground: "#B57C2B", //orange background of circles
        topBackground: "#87617C", //light purple background
        background: "#000000", //cream background
        boxBackground: "#9C7C93", //lighter purple
        welcomeText: "#87617C", //purple
        linkText: "#4753FF", //lighter blue
    },
    light: {
        text: "#000000", //main text on page
        decorativeText: "#C1521E", //orange text
        decorativeBackground: "#F7B557", //orange background of circles
        topBackground: "#E0D5DD", //light purple background
        background: "#F8F2E5", //cream background
        boxBackground: "#F8F2E5", //cream background
        welcomeText: "#C296B6", //light purple text
        linkText: "blue",
    }
}