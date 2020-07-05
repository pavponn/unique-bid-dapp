import React, {useState} from 'react'
import {ethers} from 'ethers';
import {usePoller} from '../hooks';
import PropTypes from 'prop-types'

export default function Balance(props) {

    const [dollarMode, setDollarMode] = useState(true);
    const [balance, setBalance] = useState();


    const getBalance = async () => {
        if (props.address && props.provider) {
            try {
                const newBalance = await props.provider.getBalance(props.address)
                setBalance(newBalance)
            } catch (e) {
                console.log(e)
            }
        }
    };

    usePoller(() => {
        getBalance()
    }, props.pollTime ? props.pollTime : 1999);

    let floatBalance = parseFloat("0.00");

    let usingBalance = balance;

    if (typeof props.balance !== "undefined") {
        usingBalance = props.balance;
    }

    if (usingBalance) {
        let etherBalance = ethers.utils.formatEther(usingBalance);
        parseFloat(etherBalance).toFixed(2);
        floatBalance = parseFloat(etherBalance)
    }

    let displayBalance = floatBalance.toFixed(4);

    if (props.dollarMultiplier && dollarMode) {
        displayBalance = "$" + (floatBalance * props.dollarMultiplier).toFixed(2)
    }

    return (
        <span style={{verticalAlign: "middle", fontSize: props.size ? props.size : 24, padding: 8, cursor: 'pointer'}}
              onClick={() => {
                  setDollarMode(!dollarMode)
              }}>
      {displayBalance}
    </span>
    );
}

Balance.propTypes = {
    address: PropTypes.string,
    provider: PropTypes.object,
    dollarMultiplier: PropTypes.number,
    pollTime: PropTypes.number,
    balance: PropTypes.object
};
