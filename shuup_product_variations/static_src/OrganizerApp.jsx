/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from 'react';
import VariationOrganizer from './VariationOrganizer';
import VariationSelect from './VariationSelect';
import Client from './Client';

const OrganizerApp = () => {
  const [state, setState] = useState({
    variableData: {},

    organizing: false,
    loading: true,
    updating: false,
  });

  /*
    Initialize the state
  */
  useEffect(() => {
    Client.get(window.SHUUP_PRODUCT_VARIATIONS_DATA.variation_url)
      .then((response) => {
        const preSavedVariables = response.data.variables || {};
        const preSavedVariableValues = response.data.values || {};
        const variableData = {};
        if (preSavedVariableValues) {
          Object.keys(preSavedVariables).forEach((variableId) => {
            const variableItem = preSavedVariables[variableId];
            variableData[variableItem.name] = preSavedVariableValues[variableId].map((item) => item.name);
          });
          setState((prevState) => ({
            ...prevState,
            variableData,
            loading: false,
          }));
        }
      })
      .catch(() => {
        setState((prevState) => ({
          ...prevState,
          loading: false,
        }));
      });
  }, []);

  /*
      Help utils to update the current state based on customer variation updates
    */
  const removeVariationSelect = (variableId, variableName) => {
    setState((prevState) => ({ ...prevState, updating: true }));
    Client.request({
      url: window.SHUUP_PRODUCT_VARIATIONS_DATA.variation_url,
      method: 'DELETE',
      data: { name: variableName },
    })
      .then(() => {
        const newVariableData = { ...state.variableData };
        delete newVariableData[variableName];
        setState((prevState) => ({
          ...prevState,
          variableData: newVariableData,
          updating: false,
        }));
      })
      .catch(() => {
        setState((prevState) => ({
          ...prevState,
          updating: false,
        }));
      });
    return true;
    // setState((prevState) => ({ ...prevState, updating: true }));
  };

  const addVariationSelectVariable = (selectedOption) => {
    const selectedValue = selectedOption.label;
    if (!Object.keys(state.variableData).includes(selectedValue)) {
      setState((prevState) => ({ ...prevState, updating: true }));
      Client.post(window.SHUUP_PRODUCT_VARIATIONS_DATA.variation_url, { name: selectedValue, values: [] })
        .then(() => {
          const newVariableData = { ...state.variableData };
          newVariableData[selectedValue] = [];
          setState((prevState) => ({
            ...prevState,
            variableData: newVariableData,
            updating: false,
          }));
        })
        .catch(() => {
          setState((prevState) => ({
            ...prevState,
            updating: false,
          }));
        });
    }
    return true;
  };

  const updateVariationSelectValues = (variableName, selectedOptions) => {
    const selectedVariableValues = selectedOptions.map((item) => item.label);
    setState((prevState) => ({ ...prevState, updating: true }));
    Client.post(
      window.SHUUP_PRODUCT_VARIATIONS_DATA.variation_url,
      { name: variableName, values: selectedVariableValues },
    )
      .then(() => {
        const newVariableData = { ...state.variableData };
        newVariableData[variableName] = selectedVariableValues;
        setState((prevState) => ({
          ...prevState,
          variableData: newVariableData,
          updating: false,
        }));
      })
      .catch(() => {
        setState((prevState) => ({
          ...prevState,
          updating: false,
        }));
      });
    return true;
  };

  /*
    Rendering the view for current state
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
    Organize variations (at this point there isn't any pending changes)
  */
  if (state.organizing) {
    return (
      <div>
        <div className="d-flex flex-column m-3">
          <button
            type="button"
            className="btn btn-delete btn-inverse"
            onClick={() => {
              setState((prevState) => ({ ...prevState, organizing: false }));
            }}
          >
            { gettext('Go back to select variables and variable values') }
          </button>
        </div>
        <VariationOrganizer
          variationsUrl={window.SHUUP_PRODUCT_VARIATIONS_DATA.variation_url}
          variableUrlTemplate={window.SHUUP_PRODUCT_VARIATIONS_DATA.variable_url}
          variableValueUrlTemplate={window.SHUUP_PRODUCT_VARIATIONS_DATA.variable_value_url}
          onError={() => {
            setState((prevState) => ({ ...prevState, organizing: false }));
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <VariationSelect
        variationData={state.variableData}
        onAddVariable={addVariationSelectVariable}
        onChangeVariableValues={updateVariationSelectValues}
        onRemoveVariable={removeVariationSelect}
        allowAddNewVariable
        canCreate
        allowEdit
        forceDisabled={state.updating}
        variationsUrl={window.SHUUP_PRODUCT_VARIATIONS_DATA.variations_url}
      />
      <div className="d-flex flex-column m-3">
        <button
          type="button"
          className="btn btn-primary mb-4"
          onClick={() => setState((prevState) => ({ ...prevState, organizing: true }))}
        >
          { gettext('Organize current variations') }
        </button>
      </div>
    </div>
  );
};

export default OrganizerApp;
