import { useRouter } from "expo-router";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
    const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: "30%",
      }}
    >
      <Text style={{
        fontSize: 32,
        fontWeight: "500",
        marginBottom: 40,}}>
        Welcome to LoopedIn
        </Text>

        {/* Username*/}
                <View style={{
            width: "80%",
            alignItems: "flex-start"
        }}>
        <Text style={{
            marginLeft: 10,
            marginBottom:5,
            fontSize: 18,}}> Username </Text>
        <TextInput
        placeholder="User name"
        style={{
            width: "100%",
            height: 50,
            backgroundColor: "#D9D9D9",
            borderColor: "gray",
            borderWidth: 1,
            borderRadius: 25,
            marginBottom: 10,
            paddingHorizontal: 10,
        }}
        />
        </View>
        
        {/* Email*/}
        <View style={{
            width: "80%",
            alignItems: "flex-start"
        }}>
        <Text style={{
            marginLeft: 10,
            marginBottom:5,
            fontSize: 18,}}> Email </Text>
        <TextInput
        placeholder="example@email.com"
        style={{
            width: "100%",
            height: 50,
            backgroundColor: "#D9D9D9",
            borderColor: "gray",
            borderWidth: 1,
            borderRadius: 25,
            marginBottom: 10,
            paddingHorizontal: 10,
        }}
        />
        </View>

        {/* Password*/}
        <View style={{
            width: "80%",
            alignItems: "flex-start"
        }}>
        <Text style={{
            marginLeft: 10,
            marginBottom:5,
            fontSize: 18,}}>
        Password
        </Text>
        <TextInput
        placeholder="Password"
        secureTextEntry={true}
        style={{
            width: "100%",
            height: 50,
            borderColor: "gray",
            backgroundColor: "#D9D9D9",
            borderWidth: 1,
            borderRadius: 25,
            paddingHorizontal: 10,
        }}
        />

        </View>
        {/* Login button*/}
        <TouchableOpacity onPress={() => console.log("Login tapped")}
        style={{
            width: "80%",
            height: 55,
            borderColor: "gray",
            backgroundColor: "#D9D9D9",
            borderWidth: 1,
            marginTop: 40,
            borderRadius: 25,
            paddingHorizontal: 10,
            alignItems: "center",
            justifyContent: "center",
            }}>
                <Text style={{
                    fontSize: 25,
                    fontWeight: "600"
                }}>Sign Up</Text>
            </TouchableOpacity>

            <View style={{
            width: "80%",
            alignItems: "flex-start",
            flexDirection: "row",
            marginTop: 5,
        }}>
            {/*Login*/}
            <Text> Already have an account? </Text>
            <TouchableOpacity onPress ={() => router.push("/login")}> 
                <Text style=
                {{ 
                    color: "blue",
                    marginRight: 5,
                    }}> Login</Text>
            </TouchableOpacity>
        </View>
        {/* Divider OR */}
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            width: "80%",
            marginTop: 30,
            }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "gray" }} />
                <Text style={{ marginHorizontal: 10, color: "gray" }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: "gray" }} />
            </View>

            <View
                style={{
                    borderWidth: 1,
                    borderColor: "gray",
                    borderRadius: 25,
                    padding: 5,
                    width: "80%",
                    alignItems: "center",
                    marginTop: 40,
                }}> 
                <TouchableOpacity onPress={()=> console.log ("Google Login tapped")}
                style ={{
                    alignSelf:"center",
                }}
            >
                <Image
                source ={require("../assets/images/googleicon/netural_sign_in.png")}
                    style={{ 
                        width:220,
                        height: 44,
                        resizeMode: "contain"
                     }}
                    />
            </TouchableOpacity>
        </View>
    </View>
  );
}