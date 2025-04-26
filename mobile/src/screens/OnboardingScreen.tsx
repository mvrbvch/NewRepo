import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions, 
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/api';

const { width } = Dimensions.get('window');

// Onboarding steps data
const onboardingSteps = [
  {
    id: '1',
    title: 'Welcome to Couples Calendar',
    description: 'Seamlessly organize your life with your partner and strengthen your relationship.',
    image: require('../../assets/icon.png'),
  },
  {
    id: '2',
    title: 'Stay Synchronized',
    description: 'Share events, tasks, and important dates with your partner in real-time.',
    image: require('../../assets/icon.png'),
  },
  {
    id: '3',
    title: 'Manage Tasks Together',
    description: 'Assign and track household tasks to create a balanced partnership.',
    image: require('../../assets/icon.png'),
  },
  {
    id: '4',
    title: 'Connect with Your Partner',
    description: 'Invite your partner to join and start planning your life together.',
    image: require('../../assets/icon.png'),
  },
];

const OnboardingScreen = () => {
  const { user, refreshUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  
  // Handle slide change
  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Move to next slide
  const goToNextSlide = () => {
    if (currentIndex < onboardingSteps.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update user onboarding status
      await api.auth.updateProfile({
        onboardingComplete: true
      });
      
      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render onboarding item
  const renderItem = ({ item }: { item: typeof onboardingSteps[0] }) => {
    return (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  // Render dots indicator
  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingSteps.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View 
              key={index.toString()} 
              style={[
                styles.dot, 
                { width: dotWidth, opacity }
              ]} 
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.slidesContainer}>
        <FlatList
          data={onboardingSteps}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>
      
      {renderDots()}
      
      <View style={styles.buttonContainer}>
        {currentIndex < onboardingSteps.length - 1 ? (
          <TouchableOpacity style={styles.button} onPress={goToNextSlide}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.button} 
            onPress={completeOnboarding}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Get Started</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slidesContainer: {
    flex: 1,
  },
  slide: {
    flex: 1,
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 40,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginHorizontal: 4,
  },
  buttonContainer: {
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4F46E5',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;