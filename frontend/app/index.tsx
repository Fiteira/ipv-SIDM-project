import { StyleSheet, Text, View } from "react-native";

import api from '@/config/api';

api.get('/')
  .then((response) => {
    console.log('API response: successfull', response.data);
  })
  .catch((error: any) => {
    console.error('API error:', error);
  })
  .finally(() => {
    console.log('API request complete.');
  });

export default function Page() {
  return (
    <View style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>Hello World</Text>
        <Text style={styles.subtitle}>This is the first page of your app.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  },
  main: {
    flex: 1,
    justifyContent: "center",
    maxWidth: 960,
    marginHorizontal: "auto",
  },
  title: {
    fontSize: 64,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 36,
    color: "#38434D",
  },
});
