/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from 'react';
import Client from './Client';

const ProductVariationOrganizer = ({
  productId,
  onQuit,
}) => {
  const [state, setState] = useState({
    loading: false,
    updating: false,
    translating: false,
    productId,
    variablesData: {},
    valuesData: {},
    variableChanges: {},
    variableValueChanges: {}
  });

  const fetchVariations = async (url) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      const variablesData = data.variables;
      const valuesData = data.values;
      setState((prevState) => ({
        ...prevState,
        variablesData,
        valuesData,
        loading: false,
      }));
    } catch {
      // setError(true);
    } finally {
      // setLoading(false);
    }
  };

  useEffect(() => {
    setState((prevState) => ({ ...prevState, loading: true }));
    const variationURL = window.SHUUP_PRODUCT_VARIATIONS_DATA.variations_url.replace('xxxx', productId);
    fetchVariations(variationURL);
  }, []);

  const onChangeVariableOrder = (id, value) => {
    const newData = { ...state.variablesData };
    const variableData = newData[id];
    if (variableData.order !== value) {
      newData[id].order = value;
      const changes = { ...state.variableChanges}
      changes[id] = true
      return setState((prevState) => ({
        ...prevState,
        variablesData: newData,
        variableChanges: changes
      }));
    }
  }

  const onChangeVariableValueOrder = (variableId, valueId, value) => {
    const newData = { ...state.valuesData };
    const valueData = newData[variableId].find((item) => {
      return (item.id == valueId);
    })
    if (valueData.order !== value) {
      valueData.order = value;
      const changes = { ...state.variableValueChanges}
      changes[valueId] = true;
      setState((prevState) => ({
        ...prevState,
        valuesData: newData,
        variableValueChanges: changes
      }));
    }
  }

  const onUpdateVariableOrder = (id) => {
    if (state.variableChanges[id]) {
      const variableData = state.variablesData[id];
      Client.post(
        window.SHUUP_PRODUCT_VARIATIONS_DATA.variable_url.replace('xxxx', id),
        {'ordering': variableData.order}
      )
        .then(() => {
          const changes = { ...state.variableChanges}
          delete changes[id];

          window.Messages.enqueue({
            text: gettext('Variable saved successfully!'),
            tags: 'success',
          });
          setState((prevState) => ({
            ...prevState,
            updating: false,
            variableChanges: changes,
          }));
        })
        .catch((error) => {
          window.Messages.enqueue({
            text: gettext('Saving variable failed! Try again...'),
            tags: 'error',
          });

          setState((prevState) => ({
            ...prevState,
            updating: false
          }));
        });

      return setState((prevState) => ({
        ...prevState,
        updating: true,
      }));
    }
  };

  const onUpdateVariableValue = (variableId, valueId) => {
    if (state.variableValueChanges[valueId]) {
      const valueData = state.valuesData[variableId].find((item) => {
        return (item.id == valueId);
      })
      Client.post(
        window.SHUUP_PRODUCT_VARIATIONS_DATA.variable_value_url.replace('xxxx', valueId),
        {'ordering': valueData.order}
      )
        .then(() => {
          const changes = { ...state.variableValueChanges}
          delete changes[valueId];
          window.Messages.enqueue({
            text: gettext('Variable value saved successfully!'),
            tags: 'success',
          });
          setState((prevState) => ({
            ...prevState,
            updating: false,
            variableValueChanges: changes,
          }));
        })
        .catch((error) => {
          window.Messages.enqueue({
            text: gettext('Saving variable value failed! Try again...'),
            tags: 'error',
          });

          setState((prevState) => ({
            ...prevState,
            updating: false
          }));
        });

      return setState((prevState) => ({
        ...prevState,
        updating: true,
      }));
    }
  };

  const onTranslate = (url) => {
    console.log('updating order');
    return setState((prevState) => ({
      ...prevState,
      translating: true,
    }));
  };

  if (state.loading) {
    return (
      <div className="flex-d flex-grow-1 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">{ gettext('Loading...') }</span>
        </div>
      </div>
    );
  } if (state.translating) {
    return (
      <div>
        <div className="d-flex flex-column m-3">
          <button
            type="button"
            className="btn btn-delete btn-inverse"
            onClick={(event) => {
              event.preventDefault();
              return setState((prevState) => ({ ...prevState, translating: false }));
            }}
          >
            { gettext('Go back to variation organizer') }
          </button>
        </div>
        <h3>{ gettext('Translate') }</h3>
      </div>
    );
  }
  return (
    <div>
      <div className="d-flex flex-column m-3">
        <button
          type="button"
          className="btn btn-delete btn-inverse"
          onClick={() => { onQuit(); }}
        >
          { gettext('Go back to current product variations') }
        </button>
      </div>
      <h3>{ gettext('Update variation order, names and translations') }</h3>
      {Object.keys(
        state.variablesData
      ).sort((a, b) => {
        return state.variablesData[a].order - state.variablesData[b].order;
      }).map((variableId, idx) => {
        console.log(variableId)
        const variable = state.variablesData[variableId];
        const values = state.valuesData[variableId];
        return (
          <div className="d-flex flex-column m-3" key={`variations-${variableId}`}>
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
                  onBlur={(event) => {
                    onUpdateVariableOrder(variableId);
                  }}
                />
              </div>
              <div className="d-flex flex-column">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onTranslate}
                >
                  { gettext('Translate') }
                </button>
              </div>
            </div>
            <ul>
              {
                values
                .sort((a, b) => {
                  return a.order - b.order;
                })
                .map((value, idx) => (
                  <div className="d-flex flex-column mt-2" key={value.id}>
                    <h4>{ value.name }</h4>
                    <div className="d-flex flex-row align-items-end">
                      <div className="d-flex flex-grow-1 flex-column mr-1">
                        <small>{ gettext('Ordering') }</small>
                        <input
                          type="text"
                          className="form-control"
                          value={value.order}
                          onChange={(event) => {
                            onChangeVariableValueOrder(variableId, value.id, event.target.value);
                          }}
                          onBlur={(event) => {
                            onUpdateVariableValue(variableId, value.id);
                          }}
                        />
                      </div>
                      <div className="d-flex flex-column">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={onTranslate}
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
export default ProductVariationOrganizer;
