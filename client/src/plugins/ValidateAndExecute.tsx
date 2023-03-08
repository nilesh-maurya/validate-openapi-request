import React, { useState } from 'react';
// import useAsync from '../utils/useAsync';

export default function ValidateAndExecutePlugin(system: any) {
  return {
    wrapComponents: {
      execute: (OGExecute: any, system: any) => (props: any) => {
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
            specJson: specSelectors.specJson().toJS(),
            specJsonWithResolvedSubtrees:
              specSelectors.specJsonWithResolvedSubtrees(),
          });

          if (!oas3ValidateBeforeExecuteSuccess) {
            validationErrors.missingBodyValue = true;
            console.log('Body:', { validationErrors });
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
            header: {},
            query: {},
            path: {},
            cookie: {},
          };
          for (const [key, value] of Object.entries(parameterValues)) {
            const [reqField, fieldName] = key.split('.');
            if (parameter[reqField]) {
              parameter[reqField][fieldName] = value;
            } else {
              console.error(
                `parameter: '${reqField}' is invalid, Please check OpenAPI Specification documentation (https://swagger.io/specification/#parameter-object)`
              );
            }
          }

          return parameter;
        };

        const [state, setState] = useState<any>({
          isLoading: false,
          validationErrors: [],
        });

        React.useEffect(() => {
          if (state.isLoading) {
            validateRequest(state.request);
          }
        }, [state.request]);

        const handleValidationResultPass = () => {
          let { path, method, specSelectors, oas3Selectors } = props;

          // create Parameter
          const parameter = createParameters(props);
          const reqBody = oas3Selectors.requestBodyValue(path, method);
          const requestBodyContentType = oas3Selectors.requestContentType(
            path,
            method
          );
          const specJson = specSelectors.specJson().toJS();

          setState({
            isLoading: true,
            validationErrors: [],
            request: {
              path,
              method,
              parameter,
              reqBody,
              requestBodyContentType,
              specJson,
            },
          });
        };

        const validateRequest = (request: any) => {
          console.log('making request: ', request);
          return window
            .fetch(import.meta.env.VITE_BACKEND_URL, {
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

                  setState({
                    isLoading: false,
                    request,
                    validationErrors:
                      data.error == null ? [] : data.error.errors,
                  });
                } else {
                  const error = {
                    message: data?.errors
                      ?.map((e: any) => e.message)
                      .join('\n'),
                  };
                  return Promise.reject(error);
                }
              } catch (err) {
                console.log(err);
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
            {state.validationErrors &&
            state.validationErrors.length <= 0 ? null : (
              <div className="validation-errors errors-wrapper validation-errors-textAlign">
                Please correct the following validation errors and try again.
                <ul>
                  {state.validationErrors.map((error: any, index: any) => (
                    <li key={index}> {error.customMessage} </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );
      },
    },
  };
}
