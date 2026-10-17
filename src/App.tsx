/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import BrickOSMusicStudioWorkspace from './brickos_music_studio_ai_production_workspace';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="brickOS Studio Workspace Error">
      <BrickOSMusicStudioWorkspace />
    </ErrorBoundary>
  );
}

