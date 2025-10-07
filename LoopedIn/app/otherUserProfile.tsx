import {
  Text,
  View,
  StyleSheet,
  Image,
  FlatList,
  Dimensions,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import BottomNavButton from "@/components/bottomNavBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// FIXME: delete the following line when backend set up
import mockUser from "./mockData";
import { useState } from "react";
import craftIcons from "@/components/craftIcons";

export default function UserProfile() {
  // FIXME: will need to call the userInfo from the backend when time
  const userData = mockUser;
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);


  const renderHeader = () => (
    <View>
      <View
        style={{
          backgroundColor: "#E0D5DD",
          flexDirection: "column",
          flex: 1,
          paddingTop: insets.top + 20,
          width: "100%",
          marginBottom: 30,
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <View style={{ flexDirection: "column" }}>
          {/* user info: pic, username, follower + friend count */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Image
              source={require("@/assets/images/icons8-cat-profile-100.png")}
            />
            <View>
              <Text style={{ fontSize: 20 }}>{userData.userName}</Text>
              <View style={{ flexDirection: "row", gap: 20 }}>
                <View style={{ flexDirection: "column", alignItems: "center" }}>
                  <View
                    style={{
                      backgroundColor: "#F7B557",
                      width: 50,
                      height: 50,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 25,
                      flexDirection: "row",
                    }}
                  >
                    <Text style={{ fontSize: 24, color: "#C1521E" }}>
                      {userData.numFollowers}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14 }}> Followers </Text>
                </View>
                <View style={{ flexDirection: "column", alignItems: "center" }}>
                  <View
                    style={{
                      backgroundColor: "#F7B557",
                      width: 50,
                      height: 50,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 25,
                    }}
                  >
                    <Text style={{ fontSize: 24, color: "#C1521E" }}>
                      {userData.numFriends}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14 }}> Friends </Text>
                </View>
              </View>
            </View>
          </View>

          {/* bio */}
          <View
            style={{
              flexDirection: "column",
              marginHorizontal: 30,
              marginBottom: 20,
              marginTop: 10,
            }}
          >
            <Text style={{ fontSize: 14 }}> Bio </Text>
            <View
              style={{
                backgroundColor: "#F8F2E5",
                padding: 10,
                borderRadius: 15,
              }}
            >
              <Text style={{ fontSize: 14 }}>{userData.userBio}</Text>
            </View>
          </View>

          {/* craft tags */}
          <View
            style={{
              flexDirection: "column",
              marginBottom: 30,
              marginHorizontal: 30,
            }}
          >
            <Text> Crafts </Text>
            <View
              style={{
                backgroundColor: "#F8F2E5",
                padding: 10,
                borderRadius: 15,
                flexDirection: "row",
                gap: 30,
              }}
            >
              {userData.tags.map((item, index) => (
                <View
                  key={index}
                  style={{ flexDirection: "column", alignItems: "center" }}
                >
                  <Text>{item.craft}</Text>
                  <Image source={craftIcons[item.craft]} />
                  <Text>{item.skill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* follow, message, and block buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-evenly",
              marginBottom: 30,
              alignItems: "center",
              marginHorizontal: 20,
            }}
          >
            <View
              style={{
                backgroundColor: "#F8F2E5",
                paddingVertical: 10,
                paddingHorizontal: 40,
                borderRadius: 15,
              }}
            >
              <Text style={{ fontSize: 14 }}> Follow </Text>
            </View>
            <View
              style={{
                backgroundColor: "#F8F2E5",
                paddingVertical: 10,
                paddingHorizontal: 40,
                borderRadius: 15,
              }}
            >
              <Text style={{ fontSize: 14 }}> Message </Text>
            </View>

            {/* Block/report button */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(!modalVisible)}
            >
              <TouchableWithoutFeedback
                onPress={() => setModalVisible(false)}
              >
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "center",
                    flex: 1,
                    width: "100%",
                  }}
                >
                  <TouchableWithoutFeedback
                    onPress={(e) => e.stopPropagation()}
                  >
                    <View
                      style={{
                        margin: 20,
                        backgroundColor: "#F8F2E5",
                        borderRadius: 20,
                        alignItems: "center",
                        paddingVertical: 30,
                        width: "80%",
                        borderWidth: 2,
                        borderColor: "#E0D5DD",
                        shadowColor: "#F7B557",
                        shadowOpacity: 1,
                        shadowRadius: 10,
                        elevation: 5,
                      }}
                    >
                      <Pressable style={styles.modalButtonText}>
                        <Text style={styles.modalFont}> Block User </Text>
                      </Pressable>
                      <Pressable style={styles.modalButtonText}>
                        <Text style={styles.modalFont}> Report User </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setModalVisible(!modalVisible)}
                        style={styles.modalButtonText}
                      >
                        <Text style={{ fontSize: 18 }}> Cancel </Text>
                      </Pressable>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            <Pressable onPress={() => setModalVisible(true)}>
              {/* FIXME: Change this to a circle icon */}
              <View style={{padding: 10, backgroundColor: "#F8F2E5", borderRadius: 30}}>
                <Text>...</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.postTabs}>
        <View style={styles.postTabText}>
          <Text style={{color: "#C1521E"}}>{userData.userName}'s Posts</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container]}>
      <View style={styles.topBackground} />
      <View style={styles.bottomBackground} />
      <FlatList
        data={userData.posts}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <Image
            source={item}
            resizeMode="cover"
            style={{
              width: Dimensions.get("window").width / 3 - 10,
              height: (Dimensions.get("window").width / 3 - 10) * (16 / 9), //aspect ration 16/9
              borderRadius: 20,
              marginBottom: 5,
            }}
          />
        )}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          backgroundColor: "#F8F2E5",
        }}
        columnWrapperStyle={{
          justifyContent: "space-between",
          marginHorizontal: 10,
        }}
      />
      <BottomNavButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginBottom: 20,
    alignItems: "center",
  },
  postTabText: {
    backgroundColor: "#F7B557",
    padding: 10,
    borderRadius: 15,
  },
  topBackground: {
    backgroundColor: "#E0D5DD",
    height: "50%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  bottomBackground: {
    backgroundColor: "#F8F2E5",
    height: "50%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  modalButtonText: {
    backgroundColor: "#F8F2E5",
    padding: 15,
    marginHorizontal: 30,
    marginTop: 10,
    marginBottom: 10,
    width: "80%",
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    borderColor: "#E0D5DD",
  },
  modalFont: {
    fontSize: 16,
    color: "red",
    fontWeight: "bold",
  },
});
