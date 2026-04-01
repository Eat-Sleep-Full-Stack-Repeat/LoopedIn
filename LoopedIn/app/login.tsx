import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { Storage } from "../utils/storage";
import API_URL from '../utils/config';
import Ionicons from '@expo/vector-icons/Ionicons'; //for password visibility

const REMEMBERED_EMAIL_KEY = "rememberedEmail";

export default function Login() {
  const {currentTheme} = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [text, onChangeText] = useState('');
  const [password, onChangePassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);

  useEffect(() => {
    const loadRememberedEmail = async () => {
      try {
        const savedEmail = await Storage.getItem(REMEMBERED_EMAIL_KEY);

        if (savedEmail) {
          onChangeText(savedEmail);
          setRememberEmail(true);
        }
      } catch (error) {
        console.log("Error loading remembered email:", error);
      }
    };

    loadRememberedEmail();
  }, []);

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
          if (rememberEmail) {
            await Storage.setItem(REMEMBERED_EMAIL_KEY, text.trim());
          } else {
            await Storage.removeItem(REMEMBERED_EMAIL_KEY);
          }

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
        color: colors.welcomeText}}
        accessible={true}
        accessibilityRole={"header"}>
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
        value={text}
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
        <View style={{ flexDirection: "row",
                alignItems: "center",
                width: "100%",
                height: 50,
                borderColor: colors.decorativeBackground,
                backgroundColor: colors.background,
                borderWidth: 1,
                borderRadius: 25,
                paddingHorizontal: 10,}}>
            <TextInput
            placeholder="Password"
            placeholderTextColor={colors.text}
            secureTextEntry={passwordVisible}
            style={{
                flex: 1,
                color: colors.text
            }}
            onChangeText={onChangePassword}
            value={password}
            autoCorrect={false}
            autoCapitalize="none"
            />
            <Pressable onPress={() => setPasswordVisible(!passwordVisible)}
              accessible={true}
              accessibilityLabel={passwordVisible ? "Stop viewing password" : "View password"}
              accessibilityRole={"button"}>
              <Text><Ionicons 
              name={passwordVisible ? "eye-off" : "eye"}
              size={22}
              color={colors.text}
              style={{marginHorizontal: 10,}}
              /> {/* The eye emoji in the password section */} </Text>
            </Pressable>
          </View>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 5,
            }}
          >
            <Pressable
              onPress={() => setRememberEmail((previous) => !previous)}
              accessible={true}
              accessibilityRole={"checkbox"}
              accessibilityState={{ checked: rememberEmail }}
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={rememberEmail ? "checkbox" : "square-outline"}
                size={22}
                color={colors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: colors.text, fontSize: 16 }}>Remember email</Text>
            </Pressable>

            {/* Forgot Password*/}
            <TouchableOpacity onPress ={() => console.log("Forgot Password tapped")}
              accessible={true}
              accessibilityHint={"Double tap if password is forgotten."}
              accessibilityRole={"button"}>
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
          accessible={true}
          accessibilityHint={"Double tap to log into your LoopedIn account."}
          accessibilityRole={"button"}
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
            <TouchableOpacity onPress ={() => router.push("/signup")}
              accessible={true}
              accessibilityHint={"Double tap to sign up for a LoopedIn account."}
              accessibilityRole={"button"}> 
                <Text style=
                {{ 
                    color: colors.linkText,
                    marginRight: 5,
                    }}> Sign Up</Text>
            </TouchableOpacity>
        </View>
    </View>
  );
}
