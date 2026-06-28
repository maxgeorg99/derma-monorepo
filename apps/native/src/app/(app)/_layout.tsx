import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

const SKIP_AUTH = true;

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded && !SKIP_AUTH) return null;

  if (!SKIP_AUTH && !isSignedIn) return <Redirect href="/sign-in" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
