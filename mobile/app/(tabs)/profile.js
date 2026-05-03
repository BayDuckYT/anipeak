import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react-native';

export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{user?.username || 'Gezgin'}</Text>
      <Text style={styles.rank}>{user?.rank || 'Çaylak'}</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
        <LogOut size={20} color="#fff" />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { color: theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  rank: { color: theme.colors.primary, fontSize: 16, marginTop: 4 },
  logoutButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 40, 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 8 
  },
  logoutText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' }
});
