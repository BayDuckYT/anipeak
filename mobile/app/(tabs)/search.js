import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export default function Search() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Keşfet (Yakında)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }
});
