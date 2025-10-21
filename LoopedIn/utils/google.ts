import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import type React from "react";

export type UserInfoState = { userInfo?: any };
export type SetState = React.Dispatch<React.SetStateAction<UserInfoState>>;

export const googleLogin = (setState: SetState) => {
  return async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res = await GoogleSignin.signIn();

      if (isSuccessResponse(res)) {
        setState((prev) => ({ ...prev, userInfo: res.data }));
        return res.data;
      } else {
        console.log("Google sign-in cancelled by user.");
      }
    } catch (err: unknown) {
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.IN_PROGRESS:
            console.log("Google sign-in already in progress.");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.log("Play Services not available or outdated (Android).");
            break;
          default:
            console.log("Google sign-in error code:", err.code);
        }
      } else {
        console.log("Non-Google sign-in related error:", err);
      }
      throw err;
    }
  };
};
