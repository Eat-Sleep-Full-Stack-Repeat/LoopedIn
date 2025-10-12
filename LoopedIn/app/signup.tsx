import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
    const { currentTheme } = useTheme();
    const colors = Colors[currentTheme];
    const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: "30%",
        backgroundColor: colors.background
      }}
    >
      <Text style={{
        fontSize: 32,
        fontWeight: "500",
        marginBottom: 40,
        color: colors.welcomeText}}>
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
            fontSize: 18,
            color: colors.text}}> Username </Text>
        <TextInput
        placeholder="User name"
        placeholderTextColor={colors.text}
        style={{
            width: "100%",
            height: 50,
            backgroundColor: colors.background,
            borderColor: colors.decorativeBackground,
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
            fontSize: 18,
            color: colors.text}}> Email </Text>
        <TextInput
        placeholder="example@email.com"
        placeholderTextColor={colors.text}
        style={{
            width: "100%",
            height: 50,
            backgroundColor: colors.background,
            borderColor: colors.decorativeBackground,
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
            fontSize: 18,
            color: colors.text}}>
        Password
        </Text>
        <TextInput
        placeholder="Password"
        placeholderTextColor={colors.text}
        secureTextEntry={true}
        style={{
            width: "100%",
            height: 50,
            borderColor: colors.decorativeBackground,
            backgroundColor: colors.background,
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
            borderColor: colors.decorativeBackground,
            backgroundColor: colors.decorativeBackground,
            borderWidth: 1,
            marginTop: 40,
            borderRadius: 25,
            paddingHorizontal: 10,
            alignItems: "center",
            justifyContent: "center",
            }}>
                <Text style={{
                    fontSize: 25,
                    fontWeight: "600",
                    color: colors.text
                }}>Sign Up</Text>
            </TouchableOpacity>

            <View style={{
            width: "80%",
            alignItems: "flex-start",
            flexDirection: "row",
            marginTop: 5,
        }}>
            {/*Login*/}
            <Text style={{color: colors.text}}> Already have an account? </Text>
            <TouchableOpacity onPress ={() => router.push("/login")}> 
                <Text style=
                {{ 
                    color: colors.linkText,
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
                <View style={{ flex: 1, height: 1, backgroundColor: colors.text }} />
                <Text style={{ marginHorizontal: 10, color: colors.text }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.text }} />
            </View>

            <View
                style={{
                    borderWidth: 1,
                    borderColor: colors.decorativeBackground,
                    borderRadius: 25,
                    padding: 5,
                    width: "80%",
                    alignItems: "center",
                    marginTop: 40,
                    backgroundColor: "#F2F0EF"
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