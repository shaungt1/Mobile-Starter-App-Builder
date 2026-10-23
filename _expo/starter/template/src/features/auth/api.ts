import type { Session } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { hasSupabase } from "@/constants/config";
import { queryClient } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export class AuthCancelledError extends Error {
  constructor() {
    super("Sign-in was cancelled.");
    this.name = "AuthCancelledError";
  }
}

export async function signInWithApple(): Promise<void> {
  if (!hasSupabase) return;
  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashedNonce,
  }).catch((error: unknown) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ERR_REQUEST_CANCELED"
    ) {
      throw new AuthCancelledError();
    }
    throw error;
  });
  if (!credential.identityToken) throw new Error("Apple did not return an identity token.");
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
    nonce,
  });
  if (error) throw error;
}

export async function completeSessionFromUrl(url: string): Promise<Session | null> {
  const code = Linking.parse(url).queryParams?.code;
  if (typeof code !== "string") return null;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
  return data.session;
}

export async function signInWithGoogle(): Promise<void> {
  if (!hasSupabase) return;
  const redirectTo = Linking.createURL("/");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error("Google sign-in could not be started.");
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== "success") throw new AuthCancelledError();
  await completeSessionFromUrl(result.url);
}

export async function signOut(): Promise<void> {
  if (!hasSupabase) return;
  await supabase.auth.signOut();
  queryClient.clear();
}

export async function deleteAccount(): Promise<void> {
  if (!hasSupabase) return;
  const { error } = await supabase.rpc("delete_current_user");
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
  queryClient.clear();
}
