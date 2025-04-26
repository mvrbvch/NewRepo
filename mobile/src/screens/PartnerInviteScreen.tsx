import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList, MainStackParamList } from '../navigation/Navigation';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/api';

type PartnerInviteScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList | AuthStackParamList,
  'PartnerInvite' | 'AcceptInvite'
>;

type AcceptInviteRouteProp = RouteProp<AuthStackParamList, 'AcceptInvite'>;

const PartnerInviteScreen = () => {
  const navigation = useNavigation<PartnerInviteScreenNavigationProp>();
  const route = useRoute<AcceptInviteRouteProp>();
  const { user, refreshUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState(route.params?.token || '');
  const [isInviteMode, setIsInviteMode] = useState(!route.params?.token);
  
  // Handle partner invitation
  const handleInvitePartner = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.partner.invite(email);
      Alert.alert(
        'Invitation Sent',
        `An invitation has been sent to ${email}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error sending partner invitation:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle accepting an invitation
  const handleAcceptInvite = async () => {
    if (!inviteToken.trim()) {
      Alert.alert('Error', 'Invalid invitation token');
      return;
    }
    
    setIsLoading(true);
    try {
      await api.partner.acceptInvite(inviteToken);
      
      // If the user is already logged in, refresh their data
      if (user) {
        await refreshUser();
        Alert.alert(
          'Success',
          'You\'re now connected with your partner!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // If the user is not logged in yet, show them a message
        Alert.alert(
          'Success',
          'Invitation accepted! Please sign in to continue.',
          [
            {
              text: 'Sign In',
              onPress: () => navigation.navigate('Login' as any),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error accepting partner invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {isInviteMode ? 'Invite Your Partner' : 'Accept Partner Invitation'}
            </Text>
            
            <Text style={styles.description}>
              {isInviteMode 
                ? 'Invite your partner to join and start planning together.' 
                : 'Accept the invitation to connect with your partner.'}
            </Text>
            
            {isInviteMode ? (
              // Invite form
              <View style={styles.form}>
                <Text style={styles.label}>Partner's Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleInvitePartner}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send Invitation</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Accept invitation form
              <View style={styles.form}>
                <Text style={styles.label}>Invitation Token</Text>
                <TextInput
                  style={styles.input}
                  value={inviteToken}
                  onChangeText={setInviteToken}
                  placeholder="Enter invitation token"
                  autoCapitalize="none"
                  editable={!route.params?.token} // Disable editing if token came from params
                />
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleAcceptInvite}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Accept Invitation</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            
            {/* Toggle between invite and accept */}
            {!route.params?.token && (
              <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => setIsInviteMode(!isInviteMode)}
              >
                <Text style={styles.toggleButtonText}>
                  {isInviteMode 
                    ? 'Have an invitation? Accept it' 
                    : 'Want to invite someone? Send an invitation'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  toggleButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default PartnerInviteScreen;