import { Image, ImageSourcePropType } from "react-native";

type Tag = {
  craft: "crochet" | "knit" | "sewing";
  skill: string;
};

type ForumPost = {
  id: string;
  title: string;
  username: string;
  content: string;
  datePosted: string;
  profilePic: string | null;
};

type User = {
  userName: string;
  numFollowers: number;
  numFriends: number;
  userBio: string;
  tags: Tag[];
  profilePic: string | null;
  posts: ImageSourcePropType[];
  savedPosts: ImageSourcePropType[];
  savedForums: ForumPost[];
  forumPosts: ForumPost[];
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
  savedForums: [
    {
      id: '1',
      title: "testing #1",
      username: "user #1",
      content:
        "test post #1 a lot of data here to test the ellipsize thing hidfhsifhdshfiohesihfioehsifhsiehifhsdi  fesihfidshiof  fhisdh fodsh o",
      datePosted: "2004, 6, 13",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '2',
      title: "testing #2",
      username: "user #2",
      content: "test post #2",
      datePosted: "2010, 1, 20",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '3',
      title: "testing #3",
      username: "user #3",
      content: "test post #3",
      datePosted: "2025, 3, 5",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '4',
      title: "testing #4",
      username: "user #4",
      content: "test post #4",
      datePosted: "1991, 12, 25",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
  ],
  forumPosts: [
    {
      id: '1',
      title: "forum testing #1",
      username: "user #1",
      content:
        "test post #1 a lot of data here to test the ellipsize thing hidfhsifhdshfiohesihfioehsifhsiehifhsdi  fesihfidshiof  fhisdh fodsh o",
      datePosted: "2004, 6, 13",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '2',
      title: "forum testing #2",
      username: "user #2",
      content: "test post #2",
      datePosted: "2010, 1, 20",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '3',
      title: "forum testing #3",
      username: "user #3",
      content: "test post #3",
      datePosted: "2025, 3, 5",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '4',
      title: "forum testing #4",
      username: "user #4",
      content: "test post #4",
      datePosted: "1991, 12, 25",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '5',
      title: "forum testing #5",
      username: "user #1",
      content:
        "test post #1 a lot of data here to test the ellipsize thing hidfhsifhdshfiohesihfioehsifhsiehifhsdi  fesihfidshiof  fhisdh fodsh o",
      datePosted: "2004, 6, 13",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '6',
      title: "forum testing #6",
      username: "user #2",
      content: "test post #2",
      datePosted: "2010, 1, 20",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '7',
      title: "forum testing #7",
      username: "user #3",
      content: "test post #3",
      datePosted: "2025, 3, 5",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '8',
      title: "forum testing #8",
      username: "user #4",
      content: "test post #4",
      datePosted: "1991, 12, 25",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '9',
      title: "forum testing #9",
      username: "user #1",
      content:
        "test post #1 a lot of data here to test the ellipsize thing hidfhsifhdshfiohesihfioehsifhsiehifhsdi  fesihfidshiof  fhisdh fodsh o",
      datePosted: "2004, 6, 13",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '10',
      title: "forum testing #10",
      username: "user #2",
      content: "test post #2",
      datePosted: "2010, 1, 20",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '11',
      title: "forum testing #11",
      username: "user #3",
      content: "test post #3",
      datePosted: "2025, 3, 5",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
    {
      id: '12',
      title: "forum testing #12",
      username: "user #4",
      content: "test post #4",
      datePosted: "1991, 12, 25",
      profilePic: require("@/assets/images/icons8-cat-profile-100.png"),
    },
  ],
};
export default mockUser;
