import { useRouter } from "expo-router";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { Storage } from "../utils/storage";
import API_URL from '@/utils/config';

export default function Login() {
  const router = useRouter();

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
    console.log("Entered username:", user.trim(), "Entered email:", text.trim(), "Entered password:", password.trim());

    //check if both fields entered
    if (!user.trim() || !text.trim() || !password.trim()) {
        alert("Please enter both email and password.");
        return;
    }  

    //check if user has a valid email
    if(!isValidEmail(text)){
      alert("Invalid email format.");
      return;
    }

    //check if user has a valid username (alphanumeric w/ underscore)
    if(!isValidUsername(user)){
      alert("Invalid username format. Please ensure that your username includes only letters, numbers, and/or underscores (_).");
      return;
    }

    //check if password is alphanumeric
    if(!isAlphanumeric(password)){
      alert("Password contains at least one invalid character. Passwords must be 8-30 characters long and alphanumeric.");
      return;
    }

    //check if password is between 8 and 30 characters long
    if(password.length < 8){
      alert("Password contains fewer than 8 characters. Passwords must be 8-30 characters long and alphanumeric.");
      return;
    } 
    else if (password.length > 30){
      alert("Password contains more than 30 characters. Passwords must be 8-30 characters long and alphanumeric.")
      return;
    }

    //check if username is between 3 and 30 characters long
    if(user.length < 3 || user.length > 24){
      alert("Username must be 3-24 characters long.");
      return;
    } 
    
    if(text.length > 321){
      alert("Email too long. Please ensure that email is at most 321 characters.")
      return;
    }

    try {
        const response = await fetch(`${API_URL}/api/login/signup`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          credentials: 'include', // Ensure cookies/sessions are sent
          body: JSON.stringify({
            username: user.trim(),
            email: text.trim(),
            password: password.trim(),
          }),
        });
  
        console.log("Response status:", response.status);
        const data = await response.json();
        
        if (data.token) {
            await Storage.setItem('token', data.token);
            router.push("/userProfile"); // Redirect on success
        } else {
          console.log("Sign-up failed:", data.message);
          alert(data.message);
        }
        
    } catch (error) {
        console.log("Error during sign-up:", error);
        alert("Server error, please try again later.");
    }

  };

//for signup
const [user, onChangeUser] = useState('');
const [text, onChangeText] = useState('');
const [password, onChangePassword] = useState('');




//---------------------------------------------------------------------------------
    

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
        onChangeText={onChangeUser}
        autoCorrect={false}
        autoCapitalize="none"
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
        onChangeText={onChangePassword}
        autoCorrect={false}
        autoCapitalize="none"
        />

        </View>
        {/* Login button*/}
        <TouchableOpacity onPress={onPressSignUp}
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