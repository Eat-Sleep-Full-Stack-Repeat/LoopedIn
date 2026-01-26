import { useRef, useState, useEffect } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Image,
  TextInput,
  ImageSourcePropType,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Storage } from "@/utils/storage";
import API_URL from "@/utils/config";

type PhotoCard = {
  id: string;
  image: string;
  altText: string;
};

type CraftOption = {
  id: string;
  label: string;
  icon?: ImageSourcePropType;
};

const craftOptions: CraftOption[] = [
  {
    id: "Crochet",
    label: "Crochet",
    icon: require("@/assets/images/chrocheticon.png"),
  },
  {
    id: "Knit",
    label: "Knit",
    icon: require("@/assets/images/kniticon.png"),
  },
  {
    id: "Misc",
    label: "Misc",
    icon: require("@/assets/images/paw-icon.png"),
  },
];

type ImagePost = {
  id: string;
  caption: string;
  pictures: PhotoCard[];
  craftType: string;
  visibility: string;
};

export default function EditPost() {
    const { currentTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const colors = Colors[currentTheme];
    const router = useRouter();
    const CAPTION_LIMIT = 1000;
    const CARD_ALT_TEXT_LIMIT = 100;
    const CRAFT_TYPES = ["Crochet", "Knit", "Misc"] as const;
    const CARD_WIDTH = Math.min(Dimensions.get("window").width - 64, 400);
    const [caption, setCaption] = useState<string>("");
    const [postVisibility, setPostVisibility] = useState<"public" | "private">("public");
    const [lockedCraftId, setLockedCraftId] = useState<string>("");
    const createEmptyPhotoCard = (): PhotoCard => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        image: "",
        altText: "",
    });
    const [photoCards, setPhotoCards] = useState<PhotoCard[]>([createEmptyPhotoCard()]);
    const photoScrollRef = useRef<ScrollView | null>(null);
    const formScrollRef = useRef<ScrollView | null>(null);
    const [captionSectionY, setCaptionSectionY] = useState(0);
    const { id } = useLocalSearchParams();
    const [savedChanges, setSavedChanges] = useState(false);

    const lockedCraft =
        craftOptions.find((option) => option.id === lockedCraftId) || null;

    const handleAltTextChange = (cardId: string, text: string) => {
        setPhotoCards((prev) =>
        prev.map((card) =>
            card.id === cardId
            ? { ...card, altText: text.slice(0, CARD_ALT_TEXT_LIMIT) }
            : card
        )
        );
    };

    const scrollToSection = (offset: number) => {
        formScrollRef.current?.scrollTo({
        y: Math.max(offset - 40, 0),
        animated: true,
        });
    };

  //call the refresh
  useEffect(() => {
    const getPost = async() => {
      await fetchData();
    }
    getPost();
  }, []);


//----------------------------------------------------------------

const fetchData = async () => {
    //check token
    const token = await Storage.getItem("token");

    //login check to reduce unnecessary fetches
    if (!token) {
      alert("You need to login in & own this post before you can edit it! How did you even get here?")
      router.replace("/login")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/single-post?id=${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      )

      //if editing post that doesn't exist or someone doesn't have access to edit
      if (response.status == 404) {
        alert("This post doesn't exist")
        return;
      }

      //expired token not taken away from storage or overall not allowed to access resource
      else if (response.status == 403) {
        alert("Hold on there... you need to login first!")
        router.replace("/login")
        return
      }

      else if (!response.ok) {
        alert("Server error occured. Please try again later.")
        router.back()
        return;
      }

      const responseData = await response.json();

      const mappedPost: ImagePost = {
        id: responseData.postInfo.fld_post_pk,
        caption: responseData.postInfo.fld_caption,
        pictures: Array.isArray(responseData.postPics)
          ? responseData.postPics
              .map((image: any) => {
                if (Array.isArray(image)) {
                  const [url, alt, id] = image;
                  if (!url) return null;
                  return { id: id ?? "" , image: url, altText: alt ?? "", };
                }

                //backup
                if (image?.image) {
                  return { id: image.id ?? "", image: image.image, altText: image.altText ?? "", };
                }

                return null;
              })
              .filter(Boolean)
          : [],
        craftType: responseData.tags.find(tag => CRAFT_TYPES.includes(tag)),
        visibility: responseData.postInfo.fld_is_public
      };

      //console.log(mappedPost);

      setPhotoCards(mappedPost.pictures)
      setCaption(mappedPost.caption)
      setPostVisibility(mappedPost.visibility?"public":"private")
      setLockedCraftId(mappedPost.craftType)
    
    }
    catch(error) {
      console.log("Error fetching posts: ", error)
      alert("Server error. Please try again later.")
      router.back()
    }
  }

//----------------------------------------------------------------

  //saved changes button handler
  const saveChangedHandler = () => {
    setSavedChanges(true)
    editPost()
    //router.back()
    router.replace({
      pathname: "/singlePost/[id]",
      params: {
        id,
        editVersion: Date.now(),
        updatedCaption: caption,
      },
    });
  }

  const editPost = async () => {
    //check token
    const token = await Storage.getItem("token");

    //console.log("current Photocards:", photoCards);

    //login check to reduce unnecessary fetches
    if (!token) {
      alert("Hold on there... you need to login first!")
      router.replace("/login")
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/update?id=${id}`,
        {
          method: "PATCH",
          headers : {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            PostID: id,
            caption: caption,
            isPublic: postVisibility === "public",
            pictures: photoCards.map(card => ({
                id: card.id,
                altText: card.altText
            }))
          }),
          credentials: "include",
        }
      )

      if (response.status === 403) {
        alert("Forbidden: You do not have permission to edit this post.")
        return
      }

      else if (!response.ok) {
        alert("Server error occured. Please try again later.")
        router.back()
        return
      }

      setSavedChanges(true)

      alert("Post successfully updated!")

    }
    catch(error) {
      alert("Server error. Please try again later.")
      console.log("Error editing post:", error)
    }
  }


//----------------------------------------------------------------

    const styles = StyleSheet.create({
        keyboardAvoider: {
        flex: 1,
        backgroundColor: colors.background,
        },
        container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top + 24,
        paddingHorizontal: 24,
        },
        scrollContent: {
        paddingBottom: insets.bottom + 48,
        },
        header: {
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 10,
        marginBottom: 32,
        },
        backButton: {
        position: "absolute",
        left: 0,
        },
        backArrow: {
        fontSize: 30,
        color: colors.text,
        },
        title: {
        color: colors.text,
        fontSize: 32,
        fontWeight: "bold",
        textAlign: "center",
        },
        section: {
        marginBottom: 24,
        },
        sectionLabel: {
        color: colors.text,
        fontWeight: "700",
        fontSize: 16,
        marginBottom: 12,
        },
        lockedCraftCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.topBackground,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.boxBackground,
        },
        craftIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.decorativeBackground,
        },
        craftIconImage: {
        width: 30,
        height: 30,
        tintColor: colors.decorativeText,
        },
        craftLabelColumn: {
        flex: 1,
        },
        craftLabel: {
        color: colors.text,
        fontWeight: "600",
        fontSize: 15,
        },
        uploadContainer: {
        width: "100%",
        },
        photosWrapper: {
        marginTop: 8,
        width: "100%",
        },
        photoScrollContent: {
        paddingVertical: 8,
        paddingHorizontal: 4,
        },
        photoCard: {
        width: CARD_WIDTH,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.topBackground,
        backgroundColor: colors.boxBackground,
        padding: 20,
        },
        photoCardSpacing: {
        marginRight: 16,
        },
        cardTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "600",
        },
        uploadArea: {
        height: 200,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.decorativeText,
        //borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        //gap: 10,
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
        },
        uploadAreaDisabled: {
        borderStyle: "solid",
        backgroundColor: colors.topBackground,
        opacity: 0.9,
        },
        uploadTitle: {
        //color: colors.text,
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        },
        uploadSubtitle: {
        //color: `${colors.text}aa`,
        color: "#FFFFFF",
        fontSize: 14,
        textAlign: "center",
        },
        cardAltWrapper: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.decorativeBackground,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.background,
        },
        cardAltInput: {
        minHeight: 50,
        color: colors.text,
        fontSize: 14,
        },
        cardCounterText: {
        color: `${colors.text}99`,
        fontSize: 12,
        marginTop: 8,
        textAlign: "left",
        },
        photoHelperText: {
        marginTop: 16,
        color: `${colors.text}aa`,
        fontSize: 14,
        },
        contentSpacer: {
        minHeight: 200,
        },
        formSection: {
        marginTop: 20,
        },
        inputHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
        },
        inputLabel: {
        color: colors.text,
        fontWeight: "600",
        fontSize: 16,
        },
        counterText: {
        color: colors.text,
        fontSize: 12,
        opacity: 0.7,
        },
        input: {
        backgroundColor: colors.boxBackground,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 30,
        borderWidth: 1,
        borderColor: colors.topBackground,
        color: colors.text,
        fontSize: 16,
        },
        captionInput: {
        minHeight: 90,
        paddingTop: 15,
        textAlignVertical: "top",
        },
        postOptionsRow: {
        flexDirection: "row",
        gap: 16,
        marginTop: 32,
        },
        postOptionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.topBackground,
        backgroundColor: colors.boxBackground,
        },
        postOptionButtonSelected: {
        backgroundColor: colors.decorativeBackground,
        borderColor: colors.decorativeBackground,
        },
        postOptionIcon: {
        color: colors.text,
        },
        postOptionIconSelected: {
        color: colors.decorativeText,
        },
        postOptionText: {
        color: colors.text,
        fontWeight: "600",
        fontSize: 16,
        },
        postOptionTextSelected: {
        color: colors.decorativeText,
        },
        submitButton: {
        marginTop: 32,
        paddingVertical: 16,
        borderRadius: 20,
        backgroundColor: colors.decorativeBackground,
        alignItems: "center",
        justifyContent: "center",
        },
        submitButtonText: {
        color: colors.decorativeText,
        fontSize: 18,
        fontWeight: "700",
        }, 
        disabledPhotoBackground: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
        borderRadius: 16,
        },
        disabledOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.35)",
        borderRadius: 16,
        },
        disabledContent: {
        zIndex: 2,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        },
    });

    return (
        <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        //keyboardVerticalOffset={insets.top}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : insets.top}
        >
        <ScrollView
            ref={formScrollRef}
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() =>
            router.replace({
              pathname: "/singlePost/[id]",
              params: { id: id },
            })
          }>
                <Text style={styles.backArrow}>←</Text>
            </Pressable>
            <Text style={styles.title}>Edit Post</Text>
            </View>

            <View style={styles.section}>
            <Text style={styles.sectionLabel}>Associated Craft</Text>
            <View style={styles.lockedCraftCard}>
                {lockedCraft?.icon ? (
                <View style={styles.craftIconWrapper}>
                    <Image
                    source={lockedCraft.icon}
                    style={styles.craftIconImage}
                    resizeMode="contain"
                    />
                </View>
                ) : (
                <View style={[styles.craftIconWrapper, { opacity: 0.5 }]}>
                    <Text style={{ color: colors.decorativeText }}>?</Text>
                </View>
                )}
                <View style={styles.craftLabelColumn}>
                <Text style={styles.craftLabel}>
                    {lockedCraft?.label || "Loading craft..."}
                </Text>
                </View>
            </View>
            </View>

            <View style={styles.uploadContainer}>
            <View style={styles.photosWrapper}>
                <ScrollView
                ref={photoScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoScrollContent}
                scrollEnabled={photoCards.length > 1}
                pagingEnabled
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 16}
                snapToAlignment="start"
                >
                {photoCards.map((card, index) => (
                    <View
                    key={card.id}
                    style={[
                        styles.photoCard,
                        index !== photoCards.length - 1 && styles.photoCardSpacing,
                    ]}
                    >
                    <Text style={[styles.cardTitle, { marginBottom: 12 }]}>
                        Photo {index + 1}
                    </Text>

                    <View style={[styles.uploadArea, styles.uploadAreaDisabled]}>
                    {/* bg image */}
                        {card.image && (
                        <Image
                            source={{ uri: card.image }}
                            style={styles.disabledPhotoBackground}
                            resizeMode="cover"
                            accessible={false}
                        />
                        )}

                    {/* overlay */}
                    <View style={styles.disabledOverlay} />

                    {/* text content */}
                    <View style={styles.disabledContent}>
                        <Feather name="image" size={40} 
                        // color={colors.decorativeText}
                         color="#FFFFFF"/>
                        <Text style={styles.uploadTitle}>Photo updates disabled</Text>
                        <Text style={styles.uploadSubtitle}>
                        Add or remove photos on the create flow. Update alt text here.
                        </Text>
                    </View>
                    </View>


                    <View style={styles.cardAltWrapper}>
                        <TextInput
                        value={card.altText}
                        onChangeText={(text) => handleAltTextChange(card.id, text)}
                        placeholder="Describe this photo for accessibility (max 100 characters)"
                        placeholderTextColor={`${colors.decorativeText}cc`}
                        style={styles.cardAltInput}
                        multiline
                        maxLength={CARD_ALT_TEXT_LIMIT}
                        />
                        <Text style={styles.cardCounterText}>
                        {card.altText.length}/{CARD_ALT_TEXT_LIMIT}
                        </Text>
                    </View>
                    </View>
                ))}
                </ScrollView>
            </View>
        </View>

            <View
            style={styles.formSection}
            onLayout={(event) => setCaptionSectionY(event.nativeEvent.layout.y)}
            >
            <View style={styles.inputHeaderRow}>
                <Text style={styles.inputLabel}>Caption</Text>
                <Text style={styles.counterText}>
                {caption.length}/{CAPTION_LIMIT}
                </Text>
            </View>
            <TextInput
                value={caption}
                onChangeText={(text) => setCaption(text.slice(0, CAPTION_LIMIT))}
                placeholder="Add a caption"
                placeholderTextColor={`${colors.text}99`}
                style={[styles.input, styles.captionInput]}
                maxLength={CAPTION_LIMIT}
                multiline
                onFocus={() => scrollToSection(captionSectionY)}
            />
            </View>

            <View style={styles.postOptionsRow}>
            <Pressable
                style={[styles.postOptionButton, postVisibility === "public" && styles.postOptionButtonSelected]}
                onPress={() => setPostVisibility("public")}
            >
                <Feather
                name="globe"
                size={20}
                style={[styles.postOptionIcon, postVisibility === "public" && styles.postOptionIconSelected]}
                />
                <Text
                style={[
                    styles.postOptionText,
                    postVisibility === "public" && styles.postOptionTextSelected,
                ]}
                >
                Public Post
                </Text>
            </Pressable>

            <Pressable
                style={[styles.postOptionButton, postVisibility === "private" && styles.postOptionButtonSelected]}
                onPress={() => setPostVisibility("private")}
            >
                <Feather
                name="lock"
                size={20}
                style={[styles.postOptionIcon, postVisibility === "private" && styles.postOptionIconSelected]}
                />
                <Text
                style={[
                    styles.postOptionText,
                    postVisibility === "private" && styles.postOptionTextSelected,
                ]}
                >
                Private Post
                </Text>
            </Pressable>
            </View>

            <Pressable style={styles.submitButton} onPress={saveChangedHandler}>
            <Text style={styles.submitButtonText}>Submit</Text>
            </Pressable>

            <View style={styles.contentSpacer} />
        </ScrollView>
        </KeyboardAvoidingView>
    );
    }
