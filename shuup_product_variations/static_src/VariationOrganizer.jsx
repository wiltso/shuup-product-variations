/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2021, Shuup Commerce Inc. All rights reserved.
 *
 * This source code is licensed under the Shuup Commerce Inc -
 * SELF HOSTED SOFTWARE LICENSE AGREEMENT executed by Shuup Commerce Inc, DBA as SHUUP®
 * and the Licensee.
 */
import React, { useEffect, useState } from 'react';
import Client from './Client';

const VariationOrganizer = ({
  variationsUrl, variableUrlTemplate, variableValueUrlTemplate, onError
}) => {
  const [state, setState] = useState({
    loading: false,
    updating: false,
    translating: false,
    translationsData: {},
    updateTranslatesUrl: null,
    variablesData: {},
    valuesData: {},
    changes: false,
  });

  /*
    initializing component
  */
  useEffect(() => {
    setState((prevState) => ({ ...prevState, loading: true }));
    Client.get(variationsUrl)
      .then((response) => {
        const variablesData = response.data.variables;
        const valuesData = response.data.values;
        setState((prevState) => ({
          ...prevState,
          variablesData,
          valuesData,
          loading: false,
        }));
      })
      .catch(() => {
        window.Messages.enqueue({
          text: gettext('Loading organizer failed! Refresh page and try again...'),
          tags: 'error',
        });
        onError();
      });
  }, []);

  /*
    handling variable ordering
  */

  const onChangeVariableOrder = (id, value) => {
    const newData = { ...state.variablesData };
    const variableData = newData[id];
    if (variableData.order !== value) {
      newData[id].order = value;
      return setState((prevState) => ({
        ...prevState,
        variablesData: newData,
        changes: true,
      }));
    }
    return true;
  };

  const onUpdateVariableOrder = (id) => {
    if (state.changes) {
      const variableData = state.variablesData[id];
      Client.post(variableUrlTemplate.replace('xxxx', id), { ordering: variableData.order })
        .then(() => {
          window.Messages.enqueue({
            text: gettext('Variable saved successfully!'),
            tags: 'success',
          });
          setState((prevState) => ({
            ...prevState,
            updating: false,
            changes: false,
          }));
        })
        .catch(() => {
          window.Messages.enqueue({
            text: gettext('Saving variable failed! Try again...'),
            tags: 'error',
          });
          setState((prevState) => ({
            ...prevState,
            updating: false,
          }));
        });
      return setState((prevState) => ({
        ...prevState,
        updating: true,
      }));
    }
    return true;
  };

  /*
    handling variable value ordering
  */

  const onChangeVariableValueOrder = (variableId, valueId, value) => {
    const newData = { ...state.valuesData };
    const valueData = newData[variableId].find((item) => (item.id === valueId));
    if (valueData.order !== value) {
      valueData.order = value;
      setState((prevState) => ({
        ...prevState,
        valuesData: newData,
        changes: true,
      }));
    }
  };

  const onUpdateVariableValue = (variableId, valueId) => {
    if (state.changes) {
      const valueData = state.valuesData[variableId].find((item) => (item.id === valueId));
      Client.post(variableValueUrlTemplate.replace('xxxx', valueId), { ordering: valueData.order })
        .then(() => {
          window.Messages.enqueue({
            text: gettext('Variable value saved successfully!'),
            tags: 'success',
          });
          setState((prevState) => ({
            ...prevState,
            updating: false,
            changes: false,
          }));
        })
        .catch(() => {
          window.Messages.enqueue({
            text: gettext('Saving variable value failed! Try again...'),
            tags: 'error',
          });

          setState((prevState) => ({
            ...prevState,
            updating: false,
          }));
        });

      return setState((prevState) => ({
        ...prevState,
        updating: true,
      }));
    }
    return true;
  };

  /*
    on translate
  */
  const onTranslate = (url) => {
    Client.get(url)
      .then((response) => {
        setState((prevState) => ({
          ...prevState,
          translationsData: response.data,
        }));
      })
      .catch(() => {
        window.Messages.enqueue({
          text: gettext('Loading translations failed! Try again...'),
          tags: 'error',
        });
        return setState((prevState) => ({
          ...prevState,
          translating: false,
          translationsData: {},
          updateTranslatesUrl: null,
        }));
      });

    return setState((prevState) => ({
      ...prevState,
      translating: true,
      updateTranslatesUrl: url,
    }));
  };

  const onChangeTranslation = (languageCode, value) => {
    const newData = { ...state.translationsData };
    newData[languageCode].name = value;
    return setState((prevState) => ({
      ...prevState,
      translationsData: newData,
      changes: true,
    }));
  };

  const onUpdateTranslation = (languageCode) => {
    if (state.changes) {
      Client.post(
        state.updateTranslatesUrl,
        { language_code: languageCode, name: state.translationsData[languageCode].name },
      )
        .then(() => {
          window.Messages.enqueue({
            text: gettext('Translation saved successfully!'),
            tags: 'success',
          });
          setState((prevState) => ({
            ...prevState,
            updating: false,
          }));
        })
        .catch(() => {
          window.Messages.enqueue({
            text: gettext('Saving translation failed! Try again...'),
            tags: 'error',
          });

          setState((prevState) => ({
            ...prevState,
            updating: false,
          }));
        });

      return setState((prevState) => ({
        ...prevState,
        updating: true,
      }));
    }
    return true;
  };

  /*
    loading view
  */
  if (state.loading) {
    return (
      <div className="flex-d flex-grow-1 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">{ gettext('Loading...') }</span>
        </div>
      </div>
    );
  }

  /*
    translating mode
  */
  if (state.translating) {
    const goBackButton = (
      <div className="d-flex flex-column m-3">
        <button
          type="button"
          className="btn btn-delete btn-inverse"
          onClick={(event) => {
            event.preventDefault();
            return setState((prevState) => ({
              ...prevState,
              translating: false,
              translationsData: {},
              updateTranslatesUrl: null,
            }));
          }}
        >
          { gettext('Go back to ordering variations') }
        </button>
      </div>
    );
    return (
      <div>
        { goBackButton }
        <h3>{ gettext('Translate') }</h3>
        {
          Object.keys(state.translationsData).map((item) => {
            const languageData = state.translationsData[item];
            return (
              <div className="d-flex flex-column m-3" key={item}>
                <h4 className="control-label">{ languageData.language_name }</h4>
                <input
                  type="text"
                  className="form-control"
                  value={languageData.name}
                  disabled={state.updating}
                  onChange={(event) => onChangeTranslation(item, event.target.value)}
                  onBlur={() => onUpdateTranslation(item)}
                />
              </div>
            );
          })
        }
        { goBackButton }
      </div>
    );
  }

  /*
    updating variation ordering
  */
  return (
    <div>
      <h3>{ gettext('Update variation order, names and translations') }</h3>
      {Object.keys(
        state.variablesData,
      ).sort((a, b) => state.variablesData[a].order - state.variablesData[b].order).map((variableId) => {
        const variable = state.variablesData[variableId];
        const values = state.valuesData[variableId];
        return (
          <div className="d-flex flex-column m-3" key={'variations-' + variableId}>
            <h4>{ variable.name }</h4>
            <div className="d-flex flex-row align-items-end">
              <div className="d-flex flex-grow-1 flex-column mr-1">
                <small>{ gettext('Ordering') }</small>
                <input
                  type="text"
                  className="form-control"
                  value={variable.order}
                  onChange={(event) => {
                    onChangeVariableOrder(variableId, event.target.value);
                  }}
                  onBlur={() => {
                    onUpdateVariableOrder(variableId);
                  }}
                />
              </div>
              <div className="d-flex flex-column">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { onTranslate(variableUrlTemplate.replace('xxxx', variableId)); }}
                >
                  { gettext('Translate') }
                </button>
              </div>
            </div>
            <ul>
              {
                values
                  .sort((a, b) => (a.order - b.order)).map((value) => (
                    <div className="d-flex flex-column mt-2" key={value.id}>
                      <h4>{ value.name }</h4>
                      <div className="d-flex flex-row align-items-end">
                        <div className="d-flex flex-grow-1 flex-column mr-1">
                          <small>{ gettext('Ordering') }</small>
                          <input
                            type="text"
                            className="form-control"
                            value={value.order}
                            disable={state.updating}
                            onChange={(event) => {
                              onChangeVariableValueOrder(variableId, value.id, event.target.value);
                            }}
                            onBlur={() => {
                              onUpdateVariableValue(variableId, value.id);
                            }}
                          />
                        </div>
                        <div className="d-flex flex-column">
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              onTranslate(variableValueUrlTemplate.replace('xxxx', value.id));
                            }}
                          >
                            { gettext('Translate') }
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </ul>
          </div>
        );
      })}
    </div>
  );
};
export default VariationOrganizer;
