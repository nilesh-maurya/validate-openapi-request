/* eslint-disable react/no-unstable-nested-components */
import Editor, { EditorProps } from '@monaco-editor/react';
import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import EditorPlugin from './plugins/EditorPlugin';
import ValidateAndExecutePlugin from './plugins/ValidateAndExecute';
import spec from './spec';

function App() {
  return (
    <div className="swagger-ui-wrapper">
      <SwaggerUI
        // spec={spec}
        url="https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml"
        plugins={[ValidateAndExecutePlugin, EditorPlugin]}
      />
    </div>
  );
}

export default App;
