import React, { useState } from 'react';
import HomeScreen from './src/screens/HomeScreen';
import PipelineScreen from './src/screens/PipelineScreen';
import ARViewerScreen from './src/screens/ARViewerScreen';

type Screen = 'home' | 'pipeline' | 'ar';

interface PipelineData {
  fileName: string;
  pipelineResult: any;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [arUrl, setArUrl] = useState<string>('');

  const handleFileSelected = (data: PipelineData) => {
    setPipelineData(data);
    setCurrentScreen('pipeline');
  };

  const handleViewAR = (url: string) => {
    setArUrl(url);
    setCurrentScreen('ar');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setPipelineData(null);
  };

  const handleBackToPipeline = () => {
    setCurrentScreen('pipeline');
  };

  switch (currentScreen) {
    case 'home':
      return <HomeScreen onFileSelected={handleFileSelected} />;

    case 'pipeline':
      return pipelineData ? (
        <PipelineScreen
          fileName={pipelineData.fileName}
          pipelineResult={pipelineData.pipelineResult}
          onViewAR={handleViewAR}
          onBack={handleBackToHome}
        />
      ) : (
        <HomeScreen onFileSelected={handleFileSelected} />
      );

    case 'ar':
      return (
        <ARViewerScreen
          arUrl={arUrl}
          onBack={handleBackToPipeline}
        />
      );

    default:
      return <HomeScreen onFileSelected={handleFileSelected} />;
  }
}
