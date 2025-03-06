import { Redirect } from 'expo-router';

export default function TemplatesIndexRedirect() {
  // Redirect to the templates tab
  return <Redirect href="/(drawer)/(tabs)/templates" />;
}