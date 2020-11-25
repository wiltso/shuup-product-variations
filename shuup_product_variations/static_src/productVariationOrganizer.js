/**
 * This file is part of Shuup.
 *
 * Copyright (c) 2012-2020, Shoop Commerce Ltd. All rights reserved.
 *
 * This source code is licensed under the OSL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect, useState } from "react";

export const ProductVariationOrganizer = ({
    productId,
    onQuit,
}) => {
    const [state, setState] = useState({
        loading: false,
        updating: false,
        translating: false,
        productId: productId,
        variablesData: {},
        valuesData: {}
    });

    const fetchVariations = async (url) => {
        try {
            const res = await fetch(url);
            const data = await res.json();
            const variablesData = data["variables"];
            console.log(variablesData)
            const valuesData = data["values"];
            setState(prevState => ({
                ...prevState,
                variablesData,
                valuesData,
                loading: false
            }))
        } catch {
            // setError(true);
        } finally {
            // setLoading(false);
        }
    };

    useEffect(() => {
        setState(prevState => { return { ...prevState, loading: true } })
        const variationURL = `/sa/shuup_product_variations/${productId}/product_variations/`
        fetchVariations(variationURL)
    }, []);

    const onUpdateOrder = (url) => {
        console.log("updating order")
    }

    const onTranslate = (url) => {
        console.log("updating order")
        return setState(prevState => ({
            ...prevState,
            translating: true
        }))
    }

    if (state.loading) {
        return (
            <div className="flex-d flex-grow-1 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">{ gettext("Loading...") }</span>
                </div>
            </div>
        );
    } else if (state.translating) {
        return (
            <div>
                <div className="d-flex flex-column m-3">
                    <button
                        className="btn btn-delete btn-inverse"
                        onClick={(event) => {
                            event.preventDefault();
                            return setState(prevState => ({ ...prevState, translating: false }))
                        }}
                    >
                        { gettext("Go back to variation organizer") }
                    </button>
                </div>
                <h3>{ gettext("Translate") }</h3>
            </div>
        );
    } else {
        return (
            <div>
                <div className="d-flex flex-column m-3">
                    <button
                        className="btn btn-delete btn-inverse"
                        onClick={() => { onQuit() }}
                    >
                        { gettext("Go back to current product variations") }
                    </button>
                </div>
                <h3>{ gettext("Update variation order, names and translations") }</h3>
                {
                    Object.keys(state.variablesData).map((variableId, idx) => {
                        let variable = state.variablesData[variableId]
                        let values = state.valuesData[variableId];
                        return (
                            <div className="d-flex flex-column m-3" key={`variations-${idx}`}>
                                <h4>{ variable["name"] }</h4>
                                <div className="d-flex flex-row align-items-end">
                                    <div className="d-flex flex-grow-1 flex-column mr-1">
                                        <small>{ gettext("Ordering") }</small>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={variable["order"]}
                                            onChange={onUpdateOrder}
                                        />
                                    </div>
                                    <div className="d-flex flex-column">
                                        <button
                                            className="btn btn-primary"
                                            onClick={onTranslate}
                                        >
                                            { gettext("Translate") }
                                        </button>
                                    </div>
                                </div>
                                <ul>
                                    {
                                        values.map((value) => {
                                            return (
                                                <div className="d-flex flex-column mt-2" key={value["id"]}>
                                                    <h4>{ value["name"] }</h4>
                                                    <div className="d-flex flex-row align-items-end">
                                                        <div className="d-flex flex-grow-1 flex-column mr-1">
                                                            <small>{ gettext("Ordering") }</small>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={value["order"]}
                                                                onChange={onUpdateOrder}
                                                            />
                                                        </div>
                                                        <div className="d-flex flex-column">
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={onTranslate}
                                                            >
                                                                { gettext("Translate") }
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </ul>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}
