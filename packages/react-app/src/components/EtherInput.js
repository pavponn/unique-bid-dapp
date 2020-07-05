import React, {useState, useEffect} from 'react'
import {Blockie} from "."
import {Input} from 'antd';

export default function EtherInput(props) {

    const [mode, setMode] = useState(props.price ? "USD" : "ETH");
    const [display, setDisplay] = useState(undefined);
    const [value, setValue] = useState(undefined);

    const currentValue = typeof props.value != "undefined" ? props.value : value;

    const option = (title) => {
        if (!props.price) return "";
        return (
            <div style={{cursor: "pointer"}}
                 onClick={() => {
                     if (mode === "USD") {
                         setMode("ETH");
                         setDisplay(currentValue)
                     } else {
                         setMode("USD");
                         if (currentValue) {
                             let usdValue = "" +
                                 (parseFloat(currentValue) * props.price).toFixed(2);
                             setDisplay(usdValue)
                         } else {
                             setDisplay(currentValue)
                         }
                     }
                 }}>
                {title}
            </div>
        )
    };

    let prefix, addonAfter;
    if (mode === "USD") {
        prefix = "$";
        addonAfter = option("USD 🔀");
    } else {
        prefix = "Ξ";
        addonAfter = option("ETH 🔀");
    }

    return (
        <Input
            placeholder={props.placeholder ? props.placeholder : "amount"}
            autoFocus={props.autoFocus}
            prefix={prefix}
            value={display}
            addonAfter={addonAfter}
            onChange={async (e) => {
                let newValue = (e.target.value);
                if (mode === "USD") {
                    let ethValue = parseFloat(newValue) / props.price;
                    setValue(ethValue);
                    if (typeof props.onChange == "function") {
                        props.onChange(ethValue)
                    }
                    setDisplay(newValue)
                } else {
                    setValue(newValue);
                    if (typeof props.onChange == "function") {
                        props.onChange(newValue)
                    }
                    setDisplay(newValue)
                }
            }}
        />
    );
}
