import { Colors } from "@/Styles/colors";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Pressable,
} from "react-native";
import { useState } from "react";
import { Storage } from "../utils/storage";
import API_URL from "@/utils/config";
import Ionicons from "@expo/vector-icons/Ionicons"; //for password visibility
import { useAppSize } from "@/Hooks/useSize";

export default function Login() {
  const { currentTheme } = useTheme();
  const colors = Colors[currentTheme];
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [signupErrorOverlay, setSignupErrorOverlay] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const size = useAppSize();

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

  const isValidUsername = (username: string) => {
    const usernamePattern = /^[a-zA-Z0-9_]+$/;
    return usernamePattern.test(username.trim());
  };

  //MAIN NATIVE LOGIN FUNCTION
  const onPressSignUp = async () => {
    console.log("Sign in pressed");
    console.log(
      "Entered username:",
      user.trim(),
      "Entered email:",
      text.trim(),
      "Entered password:",
      password.trim()
    );

    //check if both fields entered
    if (!user.trim() || !text.trim() || !password.trim()) {
      setSignupErrorOverlay({
        title: "Missing Fields",
        message: "Please fill in all fields—username, email, and password are all required!",
      });
      return;
    }

    //check if user has a valid email
    if (!isValidEmail(text)) {
      setSignupErrorOverlay({
        title: "Invalid Email",
        message: "Hmm, that email doesn't look right. Please double-check and try again.",
      });
      return;
    }

    //check if user has a valid username (alphanumeric w/ underscore)
    if (!isValidUsername(user)) {
      setSignupErrorOverlay({
        title: "Invalid Username",
        message: "Usernames can only include letters, numbers, and underscores (_). No special characters!",
      });
      return;
    }

    //check if password is alphanumeric
    if (!isAlphanumeric(password)) {
      setSignupErrorOverlay({
        title: "Invalid Password",
        message: "Hmm, your password can only include letters and numbers—no special characters.",
      });
      return;
    }

    //check if password is between 8 and 30 characters long
    if (password.length < 8) {
      setSignupErrorOverlay({
        title: "Invalid Password",
        message: "Almost there! Your password needs at least 8 characters. Make it count!",
      });
      return;
    } else if (password.length > 30) {
      setSignupErrorOverlay({
        title: "Invalid Password",
        message: "Oops! Your password is too long—please use 8–30 alphanumeric characters.",
      });
      return;
    }

    //check if username is between 3 and 30 characters long
    if (user.length < 3 || user.length > 24) {
      setSignupErrorOverlay({
        title: "Invalid Username",
        message: "Username must be between 3 and 24 characters. Pick something fun!",
      });
      return;
    }

    if (text.length > 321) {
      setSignupErrorOverlay({
        title: "Invalid Email",
        message: "Oops! Email must be under 321 characters. Please shorten it and try again.",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies/sessions are sent
        body: JSON.stringify({
          username: user.trim(),
          email: text.trim(),
          password: password.trim(),
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();

      if (data.token) {
        await Storage.setItem("token", data.token);
        router.replace("/userProfile"); // Redirect on success
      } else {
        console.log("Sign-up failed:", data.message);
        setSignupErrorOverlay({
          title: "Sign Up Failed",
          message: data.message,
        });
      }
    } catch (error) {
      console.log("Error during sign-up:", error);
      setSignupErrorOverlay({
        title: "Server Error",
        message: "Something went wrong on our end. Please try again in a moment!",
      });
    }
  };

  const handleSignupErrorConfirm = () => {
    setSignupErrorOverlay(null);
  };

  //for signup
  const [user, onChangeUser] = useState("");
  const [text, onChangeText] = useState("");
  const [password, onChangePassword] = useState("");

  //---------------------------------------------------------------------------------

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: size.font.welcomeText,
            fontWeight: size.weight.largeTitle,
            marginBottom: 40,
            color: colors.decorativeBackground,
          }}
          accessible={true}
          accessibilityRole={"header"}
        >
          Welcome to LoopedIn
        </Text>

        {/* Username*/}
        <View
          style={{
            width: "80%",
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              marginLeft: 10,
              marginBottom: 5,
              fontSize: size.font.headline,
              color: colors.text,
            }}
          >
            {" "}
            Username{" "}
          </Text>
          <TextInput
            placeholder="User name"
            placeholderTextColor={colors.inputContainerPlaceholderText}
            style={{
              width: "100%",
              height: 50,
              backgroundColor: colors.background,
              borderColor: colors.decorativeBackground,
              borderWidth: 1,
              borderRadius: 25,
              marginBottom: 10,
              paddingHorizontal: 10,
              color: colors.text,
              fontSize: size.font.bodyText,
            }}
            onChangeText={onChangeUser}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* Email*/}
        <View
          style={{
            width: "80%",
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              marginLeft: 10,
              marginBottom: 5,
              fontSize: size.font.headline,
              color: colors.text,
            }}
          >
            {" "}
            Email{" "}
          </Text>
          <TextInput
            placeholder="example@email.com"
            placeholderTextColor={colors.inputContainerPlaceholderText}
            style={{
              width: "100%",
              height: 50,
              backgroundColor: colors.background,
              borderColor: colors.decorativeBackground,
              borderWidth: 1,
              borderRadius: 25,
              marginBottom: 10,
              paddingHorizontal: 10,
              color: colors.text,
              fontSize: size.font.bodyText,
            }}
            onChangeText={onChangeText}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* Password*/}
        <View
          style={{
            width: "80%",
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              marginLeft: 10,
              marginBottom: 5,
              fontSize: size.font.headline,
              color: colors.text,
            }}
          >
            Password
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "100%",
              height: 50,
              borderColor: colors.decorativeBackground,
              backgroundColor: colors.background,
              borderWidth: 1,
              borderRadius: 25,
              paddingHorizontal: 10,
            }}
          >
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.inputContainerPlaceholderText}
              secureTextEntry={passwordVisible}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: size.font.bodyText,
              }}
              onChangeText={onChangePassword}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setPasswordVisible(!passwordVisible)}
              accessible={true}
              accessibilityLabel={
                passwordVisible ? "View password" : "Stop viewing password"
              }
              accessibilityRole={"button"}
            >
              <Text>
                <Ionicons
                  name={passwordVisible ? "eye-off" : "eye"}
                  size={size.iconSize + 2}
                  color={colors.text}
                  style={{ marginHorizontal: 10 }}
                />{" "}
                {/* The eye emoji in the password section */}{" "}
              </Text>
            </Pressable>
          </View>
        </View>
        {/* Login button*/}
        <TouchableOpacity
          onPress={onPressSignUp}
          style={{
            width: "80%",
            height: 55,
            borderColor: colors.decorativeBackground,
            backgroundColor: colors.decorativeBackground,
            borderWidth: 1,
            marginTop: 40,
            marginBottom: 5,
            borderRadius: 25,
            paddingHorizontal: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessible={true}
          accessibilityHint={"Double tap to create your LoopedIn account."}
          accessibilityRole={"button"}
        >
          <Text
            style={{
              fontSize: size.font.titleText,
              fontWeight: size.weight.title,
              color: colors.antiText,
            }}
          >
            Sign Up
          </Text>
        </TouchableOpacity>

        <View
          style={{
            width: "80%",
            alignItems: "flex-start",
            flexDirection: "row",
            marginTop: 5,
          }}
        >
          {/*Login*/}
          <Text style={{ color: colors.text, fontSize: size.font.button }}>
            Already have an account?
          </Text>
          <TouchableOpacity
            onPress={() => router.replace("/login")}
            accessible={true}
            accessibilityHint={"Double tap to navigate to the log in page."}
            accessibilityRole={"button"}
          >
            <Text
              style={{
                color: colors.linkText,
                marginLeft: 5,
                fontSize: size.font.button,
              }}
            >
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {signupErrorOverlay ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: `${colors.background}E6`,
            zIndex: 999,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              paddingHorizontal: 24,
              paddingVertical: 28,
              borderRadius: 24,
              borderWidth: 1,
              backgroundColor: colors.boxBackground,
              borderColor: colors.blockedBackground,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: size.font.titleText,
                fontWeight: size.weight.largeTitle,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              {signupErrorOverlay.title}
            </Text>
            <Text
              style={{
                color: colors.settingsText,
                fontSize: size.font.button,
                lineHeight: 24,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              {signupErrorOverlay.message}
            </Text>
            <Pressable
              onPress={handleSignupErrorConfirm}
              style={{
                alignItems: "center",
                borderRadius: 999,
                paddingHorizontal: 18,
                paddingVertical: 14,
                backgroundColor: colors.activeContainer,
                minHeight: 52,
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: colors.background,
                  fontSize: size.font.button,
                  fontWeight: size.weight.largeTitle,
                  lineHeight: 20,
                }}
              >
                Ok
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
