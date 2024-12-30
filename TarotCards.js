import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, View, TouchableWithoutFeedback } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  Extrapolate,
} from 'react-native-reanimated';

const tarodCardImg =
  'https://img.freepik.com/free-vector/hand-drawn-esoteric-pattern-design_23-2149346196.jpg?size=500&ext=jpg';
const { width, height } = Dimensions.get('window');
const numberOfCards = 30;
const tarotCards = [...Array(numberOfCards).keys()].map((i) => ({
  key: `tarot-card-${i}`,
  uri: tarodCardImg,
}));

const minSize = 120;
const tarotCardSize = {
  width: minSize,
  height: minSize * 1.67,
  borderRadius: 12,
};

const TWO_PI = 2 * Math.PI;
const theta = TWO_PI / numberOfCards;
const tarotCardSizeVisiblePercentage = 0.9;
const tarotCardSizeOnCircle = tarotCardSizeVisiblePercentage * tarotCardSize.width;
const circleRadius = Math.max((tarotCardSizeOnCircle * numberOfCards) / TWO_PI, width);
const circleCircumference = TWO_PI * circleRadius;
const changeFactor = circleCircumference / width;

function TarotCard({ card, cardIndex, activeIndex, onFlip, isFlipped }) {
  const mounted = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(0);

  useEffect(() => {
    mounted.value = withTiming(1, { duration: 500 });
  }, []);

  const handleFlip = () => {
    rotateY.value = withTiming(180, { duration: 300, easing: Easing.out(Easing.exp) }, () => {
      runOnJS(onFlip)();
    });
  };

  useEffect(() => {
    scale.value = withTiming(isFlipped ? 1.2 : 1, { duration: 300, easing: Easing.out(Easing.exp) });
    rotateY.value = withTiming(isFlipped ? 180 : 0, { duration: 300, easing: Easing.out(Easing.exp) });
  }, [isFlipped]);

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(mounted.value, [0, 1], [0, theta * cardIndex])}rad`,
        },
        {
          translateY: interpolate(
            cardIndex,
            [activeIndex - 1, activeIndex, activeIndex + 1],
            [0, -tarotCardSize.height / 2, 0],
            Extrapolate.CLAMP
          ),
        },
        { scale: scale.value },
      ],
    };
  });

  const flipStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${rotateY.value}deg` }],
    };
  });

  return (
    <Animated.View
      style={[styles.cardWrapper, cardStyle]}
    >
      <TouchableWithoutFeedback onPress={handleFlip}>
        <Animated.View style={flipStyle}>
          <Image source={{ uri: isFlipped ? 'https://example.com/flipped-card-image.jpg' : card.uri }} style={styles.tarotCardBackImage} />
        </Animated.View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

function TarotWheel({ cards, onCardChange, onCardSelect, activeCardIndex, isFlippable }) {
  const distance = useSharedValue(0);
  const angle = useDerivedValue(() => distance.value / circleCircumference);

  const interpolatedIndex = useDerivedValue(() => {
    const x = Math.abs((angle.value % TWO_PI) / theta);
    return angle.value < 0 ? x : numberOfCards - x;
  });

  const activeIndex = useDerivedValue(() => Math.round(interpolatedIndex.value));

  const panGesture = Gesture.Pan()
    .onChange((ev) => {
      if (isFlippable) return;
      distance.value += ev.changeX * changeFactor;
    })
    .onFinalize((ev) => {
      if (isFlippable) return;
      distance.value = withDecay(
        { velocity: ev.velocityX, velocityFactor: changeFactor },
        () => {
          distance.value = withSpring(-activeIndex.value * theta * circleCircumference);
          runOnJS(onCardChange)(activeIndex.value);
        }
      );
    });

  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}rad` }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.wheel, wheelStyle]}>
        {cards.map((card, cardIndex) => (
          <TarotCard
            key={card.key}
            card={card}
            cardIndex={cardIndex}
            activeIndex={activeCardIndex}
            onFlip={() => onCardSelect(cardIndex)}
            isFlipped={isFlippable && activeCardIndex === cardIndex}
          />
        ))}
      </Animated.View>
    </GestureDetector>
  );
}

export function TarotCards() {
  const [activeCardIndex, setActiveCardIndex] = useState(null);
  const [isFlippable, setFlippable] = useState(false);

  const handleCardSelect = (cardIndex) => {
    setFlippable(true);
    setActiveCardIndex(cardIndex);

    setTimeout(() => resetWheel(), 1000);
  };

  const resetWheel = () => {
    setFlippable(false);
    setActiveCardIndex(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {isFlippable && (
        <View style={styles.selectedCardView}>
          <Text style={styles.selectedCardText}>You have selected card {activeCardIndex}</Text>
        </View>
      )}
      <TarotWheel
        cards={tarotCards}
        onCardChange={(cardIndex) => setActiveCardIndex(cardIndex)}
        onCardSelect={handleCardSelect}
        activeCardIndex={activeCardIndex}
        isFlippable={isFlippable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#164aa1',
  },
  cardWrapper: {
    width: tarotCardSize.width,
    height: circleRadius * 2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tarotCardBackImage: {
    width: tarotCardSize.width,
    height: tarotCardSize.height,
    borderRadius: tarotCardSize.borderRadius,
    resizeMode: 'stretch',
    borderWidth: 4,
    borderColor: 'white',
  },
  wheel: {
    width: circleRadius * 2,
    height: circleRadius * 2,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: height - tarotCardSize.height * 2,
  },
  selectedCardView: {
    position: 'absolute',
    top: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCardText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 20,
  },
});

