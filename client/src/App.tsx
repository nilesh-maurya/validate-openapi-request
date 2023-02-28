/* eslint-disable react/no-unstable-nested-components */
import SwaggerUI from 'swagger-ui-react';
import EditorPlugin from './plugins/EditorPlugin';
import ValidateAndExecutePlugin from './plugins/ValidateAndExecute';

function App() {
  return (
    <div className="swagger-ui-wrapper">
      <SwaggerUI
        url="https://raw.githubusercontent.com/swagger-api/swagger-petstore/master/src/main/resources/openapi.yaml"
        plugins={[ValidateAndExecutePlugin, EditorPlugin]}
      />
    </div>
  );
}

export default App;
