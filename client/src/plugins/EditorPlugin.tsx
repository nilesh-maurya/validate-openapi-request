import React from 'react';
import Editor, { EditorProps } from '@monaco-editor/react';
import { Allotment, setSashSize } from 'allotment';

export default function EditorPlugin() {
  return {
    wrapComponents: {
      BaseLayout: (OGBaseLayout: any, system: any) => (props: any) => {
        const editorOptions: EditorProps['options'] = {
          wordWrap: 'on',
          minimap: {
            enabled: false,
          },
        };

        const { specSelectors, specActions } = props;
        const [value, setValue] = React.useState('');
        const [language, setLanguage] = React.useState('JSON');
        const [theme, setTheme] = React.useState('vs-dark');

        setSashSize(30);

        const onEditorChange = (e: any, value: any) => {
          specActions.updateSpec(e);
        };

        React.useEffect(() => {
          if (value == '') {
            const specStr = specSelectors.specStr();
            setValue(specStr);
          }
        });

        return (
          <Allotment>
            <Allotment.Pane>
              <div className="editor-plugin-wrapper editor-wrapper pane-1">
                <Editor
                  className="editor"
                  theme={theme}
                  language={language}
                  value={value}
                  options={editorOptions}
                  onChange={onEditorChange}
                />
              </div>
            </Allotment.Pane>
            <Allotment.Pane>
              <div className="pane-2">
                <OGBaseLayout {...props} />
              </div>
            </Allotment.Pane>
          </Allotment>
        );
      },
    },
  };
}
