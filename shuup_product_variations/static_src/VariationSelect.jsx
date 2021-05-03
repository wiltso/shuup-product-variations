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
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import Client from './Client';

const VariationSelect = ({
    variationData,
    onAddVariable,
    onChangeVariableValues,
    onRemoveVariable,
    allowAddNewVariable,
    canCreate,
    allowEdit,
    forceDisabled,
    variationsUrl
}) => {
  const [state, setState] = useState({
    preSavedVariables: [],
    preSavedVariableValues: [],
    loading: false,
  });

  /*
    Initialize the state
  */
  useEffect(() => {
    Client.get(variationsUrl)
      .then((response) => {
        const preSavedVariables = response.data.variables || {};
        const preSavedVariableValues = response.data.values || {};
        setState((prevState) => ({
          ...prevState,
          preSavedVariables,
          preSavedVariableValues,
          loading: false,
        }));
      })
      .catch(() => {
        setState((prevState) => ({
          ...prevState,
          preSavedVariables: {},
          preSavedVariableValues: {},
          loading: false,
        }));
      });
  }, []);

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
      rednder selects based on passed configuration
    */
  const SelectComponent = (canCreate ? CreatableSelect : Select);
  const variableOptions = Object.keys(state.preSavedVariables).filter((variableId) => {
    const variableData = state.preSavedVariables[variableId];
    return (!(Object.keys(variationData).includes(variableData.name)));
  }).map((variableId) => {
    const variableData = state.preSavedVariables[variableId];
    return { variableId, variableName: variableData.name };
  });
  return (
    <div>
      <h3>{ gettext('Select variations') }</h3>
      {Object.keys(variationData).map((variableName) => {
        const values = variationData[variableName];
        const variableId = Object.keys(
          state.preSavedVariables,
        ).find((itemVariableId) => {
          const item = state.preSavedVariables[itemVariableId];
          return (item.name === variableName);
        });
        const valueOptions = (
          state.preSavedVariableValues[variableId] || []
        ).filter((item) => (!values.includes(item.name)));
        return (
          <div className="d-flex m-3 align-items-end" key={'pending-variations-' + variableName}>
            <div className="d-flex flex-grow-1 flex-column">
              <h4 className="control-label">{ variableName }</h4>
              <SelectComponent
                placeholder={gettext('Select values for variable...')}
                isMulti
                onChange={(selected) => {
                  onChangeVariableValues(variableName, selected || []);
                }}
                isDisabled={!allowEdit || forceDisabled}
                value={values.map((item) => ({ value: item, label: item }))}
                options={valueOptions.map((item) => ({ value: item.name, label: item.name }))}
                form="new-variable-value-form"
              />
            </div>
            {allowEdit && (
              <div>
                <i
                  className="fa fa-trash fa-2x align-self-center ml-4"
                  onClick={() => {
                    onRemoveVariable(variableId, variableName);
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      {allowAddNewVariable && (
        <div className="d-flex m-3" key="pending-variations-new">
          <SelectComponent
            className="flex-grow-1 mr-1"
            placeholder={gettext('Add new variable...')}
            onChange={(newValue) => onAddVariable(newValue)}
            isDisabled={forceDisabled}
            value={null}
            defaultValue={[]}
            options={variableOptions.map((item) => ({ value: item.variableId, label: item.variableName }))}
            form="new-variable-form"
          />
        </div>
      )}
    </div>
  );
};
export default VariationSelect;
