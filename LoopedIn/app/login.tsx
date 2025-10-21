import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";
import { Storage } from "../utils/storage";
import API_URL from '../utils/config';
import { GoogleSignin } from "@react-native-google-signin/google-signin"
import { googleLogin } from "../utils/google";

type UserInfoState = {
  userInfo?: any;
};

let configured = false;

export default function Login() {
  const {currentTheme} = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  //---------------------------------------------------------------------------------

  
      const WEB_CLIENT_ID = "483164962369-01iaiktisu321r3fac75a41k7hlcto5b.apps.googleusercontent.com"
      const IOS_CLIENT_ID = "483164962369-0rjbb7bdm9iml8212adh7jians10qrij.apps.googleusercontent.com"
      const ANDROID_CLIENT_ID = "483164962369-01iaiktisu321r3fac75a41k7hlcto5b.apps.googleusercontent.com"
    
      const [, setState] = useState<UserInfoState>({});
    
      useEffect(() => {
        if (configured) return;
        GoogleSignin.configure({
          webClientId: WEB_CLIENT_ID,
          iosClientId: IOS_CLIENT_ID,
          scopes: ["email"],
          offlineAccess: true,
          forceCodeForRefreshToken: true,
        });
        configured = true;
      }, []);
    
      const onGooglePress = googleLogin(setState);

      const onGooglePressAndSend = async () => {
        try {
          const userInfo = await onGooglePress();

          if (!userInfo) {
            alert("Google sign-in was not completed. Please try again.");
            return;
          }

          const { idToken } = await GoogleSignin.getTokens();

          if(!idToken) {
            alert ("Did not receive Google Token, Try again!")
            return;
          }
        
          const email = userInfo.user?.email;
          const googleId = userInfo.user?.id;

          if(!email|| !googleId) {
            alert("Please Try again!")
            return;
          }

          const resp = await fetch(`${API_URL}/api/google/google`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              idToken, 
              email,
              googleId,
            }),
          });
          const data = await resp.json();
          
          if(resp.ok && data?.token){
            await Storage.setItem ("token", data.token);
            router.push("/userProfile");
          } else {
            console.log ("Google login server failed:", data?.message || data);
          }
        } catch (e) {
          console.log ("Google login -> server error:", e);
          alert("Sever error, please try again!");
        }
      };
  
  //---------------------------------------------------------------------------------

  //declaring/defining helper fxns used in main native login fxn
  const isValidEmail = (email: string) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email.trim());
  };

  const isAlphanumeric = (password: string) => {
    const alphanumericPattern = /^[a-zA-Z0-9]+$/;
    return alphanumericPattern.test(password.trim());
  };

  //MAIN NATIVE LOGIN FUNCTION
  const onPressSignIn = async () => {
    console.log("Sign in pressed");
    console.log("Entered email:", text.trim(), "Entered password:", password.trim());

    //check if both fields entered
    if (!text.trim() || !password.trim()) {
        alert("Please enter both email and password.");
        return;
    }  

    //check if user has a valid email
    if(!isValidEmail(text)){
      alert("Invalid email format.");
      return;
    }

    // //check if user has a valid username (alphanumeric w/ underscore)
    // if(!isValidUsername(user)){
    //   alert("Invalid username format. Please ensure that your username includes only letters, numbers, and/or underscores (_).");
    //   return;
    // }

    //check if password is alphanumeric
    if(!isAlphanumeric(password)){
      alert("Password contains at least one invalid character. Passwords must be 8-30 characters long and alphanumeric.");
      return;
    }

    //check is password is between 8 and 30 characters long
    if(password.length < 8){
      alert("Password contains fewer than 8 characters. Passwords must be 8-30 characters long and alphanumeric.");
      return;
    } 
    else if (password.length > 30){
      alert("Password contains more than 30 characters. Passwords must be 8-30 characters long and alphanumeric.")
      return;
    }
    
    if(text.length > 321){
      alert("Email too long. Please ensure that email is at most 321 characters.")
      return;
    }

    try {
        const response = await fetch(`${API_URL}/api/login/login`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          credentials: 'include', // Ensure cookies/sessions are sent
          body: JSON.stringify({
            email: text.trim(),
            password: password.trim(),
          }),
        });
  
        console.log("Response status:", response.status);
        const data = await response.json();
        
        if (data.token) {
          await Storage.setItem('token', data.token); //store jwt info
          router.push("/userProfile"); // Redirect on success
        } else {
          console.log("Login failed:", data.message);
          alert(data.message);
        }
        
    } catch (error) {
        console.log("Error during sign in:", error);
        alert("Server error, please try again later.");
    }

  };

//for login
const [text, onChangeText] = useState('');
const [password, onChangePassword] = useState('');
// const [user, onChangeUser] = useState('');




//---------------------------------------------------------------------------------
    
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: "30%",
        backgroundColor: colors.background,
      }}
    >
      <Text style={{
        fontSize: 32,
        fontWeight: "500",
        marginBottom: 40,
        color: colors.welcomeText}}>
        Welcome Back!
        </Text>
        
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
            color: colors.text
        }}
        onChangeText={onChangeText}
        autoCorrect={false}
        autoCapitalize="none"
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
            color: colors.text
        }}
        onChangeText={onChangePassword}
        autoCorrect={false}
        autoCapitalize="none"
        />
        <View style={{
            width: "100%",
            alignItems: "flex-end",
            marginTop: 5,
        }}>
            {/* Forgot Password*/}
            <TouchableOpacity onPress ={() => console.log("Forgot Password tapped")}>
                <Text style=
                {{ 
                    color: colors.linkText,
                    marginRight: 5,
                    }}> Forgot Password?</Text>
            </TouchableOpacity>
        </View>

        </View>
        {/* Login button*/}
        <TouchableOpacity onPress={onPressSignIn}
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
                    color: colors.decorativeText
                }}>Login</Text>
            </TouchableOpacity>

            <View style={{
            width: "80%",
            alignItems: "flex-start",
            flexDirection: "row",
            marginTop: 5,
        }}>
            {/* Sign-up*/}
            <Text style={{ color: colors.text}}> Don't have an account? </Text>
            <TouchableOpacity onPress ={() => router.push("/signup")}> 
                <Text style=
                {{ 
                    color: colors.linkText,
                    marginRight: 5,
                    }}> Sign Up</Text>
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
                    backgroundColor: "#F2F0EF",
                }}> 
                <TouchableOpacity
                onPress={onGooglePressAndSend}
                style ={{
                    alignSelf:"center",
                }}
            >
                <Image
                source ={require("../assets/images/googleicon/netural_log_in.png")}
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
