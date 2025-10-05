import { Image, ImageSourcePropType } from "react-native";

type Tag = {
  craft: "crochet" | "knit" | "sewing";
  skill: string;
};

type User = {
  userName: string;
  numFollowers: number;
  numFriends: number;
  userBio: string;
  tags: Tag[];
  profilePic: ImageSourcePropType
  posts: ImageSourcePropType[];
  savedPosts: ImageSourcePropType[];
};

const mockUser: User = {
  userName: "helloWorld",
  numFollowers: 15,
  numFriends: 10,
  userBio:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  tags: [
    { craft: "crochet", skill: "advanced" },
    { craft: "knit", skill: "beginner" },
  ],
  profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
  posts: [
    require("@/assets/images/mockPosts/_.jpeg"),
    require("@/assets/images/mockPosts/Baby Sea Otter.jpeg"),
    require("@/assets/images/mockPosts/baby sunflower cow.jpeg"),
    require("@/assets/images/mockPosts/Crochet Bing Bong.jpeg"),
  ],
  savedPosts: [require("@/assets/images/mockPosts/blanket.jpeg")],
};
export default mockUser;
