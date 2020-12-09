/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from 'react';
import VariationSelect from './VariationSelect';
import Client from './Client';


const OrganizerApp = () => {
  const [state, setState] = useState({
    variableData: {},

    organizing: false,
    loading: true,
    updating: false
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
            const variableItem = preSavedVariables[variableId]
            variableData[variableItem.name] = preSavedVariableValues[variableId].map((item) => {
              return item.name;
            });
          });
          setState((prevState) => ({
            ...prevState,
            variableData,
            loading: false,
          }));
        }
      })
      .catch((error) => {
        console.log(error)
        setState((prevState) => ({
          ...prevState,
          loading: false,
        }));
      })
  }, []);

  /*
      Help utils to update the current state based on customer variation updates
    */
  const removeVariationSelect = (variableId, variableName) => {
    
  };

  const addVariationSelectVariable = (selectedOption) => {
    
  };

  const updateVariationSelectValues = (variableName, selectedOptions) => {
  
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
            onClick={() => { }}
          >
            { gettext('Go back to current product variations') }
          </button>
        </div>
        {
          <VariationOrganizer
            variationsUrl={window.SHUUP_PRODUCT_VARIATIONS_DATA.variations_url}
            variableUrlTemplate={window.SHUUP_PRODUCT_VARIATIONS_DATA.variable_url}
            variableValueUrlTemplate={window.SHUUP_PRODUCT_VARIATIONS_DATA.variable_value_url}
            onError={() => { }}
          />
        }
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
        allowAddNewVariable={true}
        canCreate={true}
        allowEdit={true}
        forceDisabled={state.updating}
        variationsUrl={window.SHUUP_PRODUCT_VARIATIONS_DATA.variations_url}
      />
    </div>
  );
};

export default OrganizerApp;
