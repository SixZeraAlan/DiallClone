import React from 'react';
import { AppRegistry } from 'react-native';
import MainContainer from './src/navigation/MainContainer';
import { name as DiallClone } from './app.json';

import { Amplify, Storage } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

function App() {
  return <MainContainer />;
}

AppRegistry.registerComponent(DiallClone, () => App);

export default App;
