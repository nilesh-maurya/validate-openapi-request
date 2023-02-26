/* eslint-disable react/no-unstable-nested-components */
import Editor, { EditorProps } from '@monaco-editor/react';
import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import ValidateAndExecutePlugin from './plugins/ValidateAndExecute';
import spec from './spec';

function App() {
  const editorOptions: EditorProps['options'] = {
    wordWrap: 'on',
  };

  const [value, setValue] = React.useState('');
  const [language, setLanguage] = React.useState('JSON');
  const [theme, setTheme] = React.useState('vs-dark');
  return (
    <div className="container">
      <div className="editor-wrapper pane-1">
        <Editor
          className="editor"
          height="100%"
          theme={theme}
          language={language}
          value={value}
          options={editorOptions}
          onChange={(e, value) => {
            console.log(value);
          }}
        />
      </div>
      <div className="swagger-ui-wrapper pane-2">
        <div className="resizer" />
        <SwaggerUI
          // spec={spec}
          url="https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml"
          plugins={[ValidateAndExecutePlugin]}
        />
      </div>
    </div>
  );
}

export default App;
