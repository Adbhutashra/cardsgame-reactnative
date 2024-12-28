
import React from 'react';
import { TarotCards } from './TarotCards';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


function App() {
  return (
    <GestureHandlerRootView style={{flex:1}}>
      <TarotCards />
    </GestureHandlerRootView>
  );
}
export default App;
