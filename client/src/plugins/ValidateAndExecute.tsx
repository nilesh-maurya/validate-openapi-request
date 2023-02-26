import React, { useState } from 'react';
import useAsync from '../utils/useAsync';

export default function ValidateAndExecutePlugin(system: any) {
  return {
    wrapComponents: {
      execute: (OGExecute: any, system: any) => (props: any) => {
        console.log(system);

        const handleValidateParameters = () => {
          console.log('Validate parameter started');
          let { specSelectors, specActions, path, method } = props;
          specActions.validateParams([path, method]);
          return specSelectors.validateBeforeExecute([path, method]);
        };

        const handleValidateRequestBody = () => {
          console.log('Validate requestBody started');
          let { path, method, specSelectors, oas3Selectors, oas3Actions } =
            props;
          let validationErrors = {
            missingBodyValue: false,
            missingRequiredKeys: new Array<any>(),
          };

          // context: reset errors, then (re)validate
          oas3Actions.clearRequestBodyValidateError({ path, method });
          let oas3RequiredRequestBodyContentType =
            specSelectors.getOAS3RequiredRequestBodyContentType([path, method]);
          let oas3RequestBodyValue = oas3Selectors.requestBodyValue(
            path,
            method
          );
          let oas3ValidateBeforeExecuteSuccess =
            oas3Selectors.validateBeforeExecute([path, method]);
          let oas3RequestContentType = oas3Selectors.requestContentType(
            path,
            method
          );

          console.log({
            path,
            method,
            oas3RequestBodyValue,
            // oas3RequestBodyValueJS: oas3RequestBodyValue.toJS(),
            oas3RequestContentType,
            oas3RequiredRequestBodyContentType,
            oas3ValidateBeforeExecuteSuccess,
            parameterValues: specSelectors
              .parameterValues([props.path, props.method])
              .toJS(),
            state: system.getState(),
            requestBodyInclusionSetting:
              oas3Selectors.requestBodyInclusionSetting(path, method),
          });

          console.log({
            props: props,
            specStr: specSelectors.specStr(),
          });

          if (!oas3ValidateBeforeExecuteSuccess) {
            validationErrors.missingBodyValue = true;
            oas3Actions.setRequestBodyValidateError({
              path,
              method,
              validationErrors,
            });
            return false;
          }
          if (!oas3RequiredRequestBodyContentType) {
            return true;
          }
          let missingRequiredKeys = oas3Selectors.validateShallowRequired({
            oas3RequiredRequestBodyContentType,
            oas3RequestContentType,
            oas3RequestBodyValue,
          });
          if (!missingRequiredKeys || missingRequiredKeys.length < 1) {
            return true;
          }
          missingRequiredKeys.forEach((missingKey: any) => {
            validationErrors.missingRequiredKeys.push(missingKey);
          });

          console.log({ validationErrors });
          oas3Actions.setRequestBodyValidateError({
            path,
            method,
            validationErrors,
          });
          return false;
        };

        const createParameters = (props: any) => {
          const { specSelectors, path, method } = props;

          const parameterValues = specSelectors
            .parameterValues([path, method])
            .toJS();

          const parameter: Record<string, any> = {
            headers: {},
            query: {},
            path: {},
          };
          for (const [key, value] of Object.entries(parameterValues)) {
            // console.log(`Key: ${key}, value: ${value}`);
            const [reqField, fieldName] = key.split('.');
            parameter[reqField][fieldName] = value;
          }

          return parameter;
        };

        // const [request, setRequest] = useState<any>(null);
        // const [isLoading, setIsLoading] = React.useState(false);
        const [state, setState] = useState<any>({ isLoading: false });

        // const { data, error, status, run } = useAsync({
        //   status: 'idle',
        //   data: null,
        //   error: null,
        // });

        React.useEffect(() => {
          if (state.isLoading) {
            // run(
            //   );
            validateRequest(state.request);
          }
        }, [state.request]);

        // switch (status) {
        //   case 'idle':
        //     break;
        //   case 'pending':
        //     setIsLoading(true);
        //     break;
        //   case 'rejected':
        //     throw error;
        //   case 'resolved':
        //     setIsLoading(false);
        //     break;
        //   default:
        //     throw new Error('This should be impossible');
        // }

        const handleValidationResultPass = () => {
          let {
            specActions,
            operation,
            path,
            method,
            specSelectors,
            oas3Selectors,
          } = props;

          console.log('validate via server');
          // create Parameter
          const parameter = createParameters(props);
          const reqBody = oas3Selectors.requestBodyValue(path, method);
          const RequestBodyContentType = oas3Selectors.requestContentType(
            path,
            method
          );
          const specStr = specSelectors.specStr();

          setState({
            isLoading: true,
            request: {
              path,
              method,
              parameter,
              reqBody,
              RequestBodyContentType,
              specStr,
            },
          });
          // setRequest({
          //   path,
          //   method,
          //   parameter,
          //   reqBody,
          //   RequestBodyContentType,
          // });

          console.log('state.request: ', state.request);
        };

        const validateRequest = (request: any) => {
          return window
            .fetch('http://localhost:3000/validate', {
              method: 'POST',
              headers: {
                'content-type': 'application/json;charset=UTF-8',
              },
              body: JSON.stringify(request),
            })
            .then(async (response) => {
              console.log('response: ', response);
              try {
                const data = await response.json();
                if (response.ok) {
                  console.log({ data });
                  setState({ isLoading: false, request });
                } else {
                  const error = {
                    message: data?.errors
                      ?.map((e: any) => e.message)
                      .join('\n'),
                  };
                  return Promise.reject(error);
                }
              } catch (e) {
                console.log(e);
              }
            });
        };

        const handleValidationResultFail = () => {
          let { specActions, path, method } = props;
          // deferred by 40ms, to give element class change time to settle.
          specActions.clearValidateParams([path, method]);
          setTimeout(() => {
            specActions.validateParams([path, method]);
          }, 40);
        };
        const handleValidationResult = (isPass: boolean) => {
          if (isPass) {
            handleValidationResultPass();
          } else {
            handleValidationResultFail();
          }
        };

        return (
          <>
            <div className="btn-wrapper">
              <button
                type="button"
                className="btn opblock-control__btn validate-btn"
                onClick={() => {
                  console.log('Validate on clicked started');
                  let paramsResult = handleValidateParameters();
                  let requestBodyResult = handleValidateRequestBody();
                  let isPass = paramsResult && requestBodyResult;
                  handleValidationResult(isPass);
                }}
              >
                Validate
              </button>
              <OGExecute {...props} />
            </div>
            {state.isLoading ? (
              <div className="loading-container">
                <div className="loading"></div>
              </div>
            ) : null}
          </>
        );
      },
    },
  };
}
